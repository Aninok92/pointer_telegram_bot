import { Telegraf, Context } from 'telegraf';
import { Markup } from 'telegraf';
import { readFileSync } from 'fs';
import { join } from 'path';
import { generateInvoice } from '../pdf/generateInvoice';
import { existsSync, mkdirSync } from 'fs';

interface Service {
  name: string;
  price: number;
}

interface Services {
  car: Service[];
  moto: Service[];
  additional: Service[];
}

interface UserState {
  selectedServices: Map<string, number>;
  currentCategory: string;
}

const userStates = new Map<number, UserState>();

const loadServices = (): Services => {
  const servicesPath = join(__dirname, '../data/services.json');
  return JSON.parse(readFileSync(servicesPath, 'utf-8'));
};

const getServiceKeyboard = (category: string, userId: number) => {
  const services = loadServices();
  const categoryServices = services[category as keyof Services];
  const userState = userStates.get(userId) || { selectedServices: new Map(), currentCategory: category };

  const buttons = categoryServices.map((service, idx) => {
    const quantity = userState.selectedServices.get(service.name) || 0;
    const buttonText = quantity > 0
      ? `✔️ ${service.name} – ${service.price} MDL × ${quantity}`
      : `${service.name} – ${service.price} MDL`;
    return [Markup.button.callback(buttonText, `service_${category}_${idx}`)];
  });

  buttons.push([
    Markup.button.callback('🧹 Очистить выбор ', 'clear_selection'),
    Markup.button.callback('✅ Завершить выбор ', 'finish_selection')
  ]);

  return Markup.inlineKeyboard(buttons);
};

export const setupUserHandlers = (bot: Telegraf) => {
  // Handle category selection
  bot.action(/^category_(.+)$/, async (ctx) => {
    const category = ctx.match[1];
    const userId = ctx.from?.id;
    
    if (!userId) return;

    if (!userStates.has(userId)) {
      userStates.set(userId, { selectedServices: new Map(), currentCategory: category });
    } else {
      userStates.get(userId)!.currentCategory = category;
    }

    await ctx.editMessageText(
      'Выберите услуги:',
      getServiceKeyboard(category, userId)
    );
  });

  // Handle service selection
  bot.action(/^service_(.+)_(\d+)$/, async (ctx) => {
    const [_, category, idxStr] = ctx.match;
    const idx = parseInt(idxStr);
    const userId = ctx.from?.id;
    if (!userId) return;
    const userState = userStates.get(userId);
    if (!userState) return;
    const services = loadServices();
    const service = services[category as keyof Services][idx];
    if (!service) return;
    const currentQuantity = userState.selectedServices.get(service.name) || 0;
    userState.selectedServices.set(service.name, currentQuantity + 1);
    await ctx.editMessageText(
      'Выберите услуги:',
      getServiceKeyboard(category, userId)
    );
  });

  // Handle finish selection
  bot.action('finish_selection', async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;

    const userState = userStates.get(userId);
    if (!userState) return;

    const services = loadServices();
    let total = 0;
    let message = 'Вы выбрали:\n';

    for (const [serviceName, quantity] of userState.selectedServices.entries()) {
      const service = services[userState.currentCategory as keyof Services]
        .find(s => s.name === serviceName);
      
      if (service) {
        const serviceTotal = service.price * quantity;
        total += serviceTotal;
        message += `– ${serviceName} × ${quantity} – ${serviceTotal} MDL\n`;
      }
    }

    message += `\n💰 Общая сумма: ${total} MDL`;

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('📄 Получить счёт в PDF', 'generate_pdf')]
    ]);

    await ctx.editMessageText(message, keyboard);
  });

  // Handle PDF generation
  bot.action('generate_pdf', async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;

    const userState = userStates.get(userId);
    if (!userState) return;

    const services = loadServices();
    let total = 0;

    for (const [serviceName, quantity] of userState.selectedServices.entries()) {
      const service = services[userState.currentCategory as keyof Services]
        .find(s => s.name === serviceName);
      
      if (service) {
        total += service.price * quantity;
      }
    }

    try {
      await ctx.answerCbQuery('Генерация PDF...');
      
      // Create temp directory if it doesn't exist
      const tempDir = join(__dirname, '../../temp');
      if (!existsSync(tempDir)) {
        mkdirSync(tempDir, { recursive: true });
      }

      const pdfPath = await generateInvoice(
        userState.selectedServices,
        userState.currentCategory,
        total
      );
      
      if (!existsSync(pdfPath)) {
        throw new Error('PDF file was not created');
      }

      await ctx.replyWithDocument({ source: pdfPath });
      await ctx.answerCbQuery('PDF успешно сгенерирован!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      await ctx.answerCbQuery('Ошибка при генерации PDF. Пожалуйста, попробуйте снова.');
      await ctx.reply('Произошла ошибка при генерации PDF. Пожалуйста, попробуйте снова или обратитесь к администратору.');
    }
  });

  // Handle clearing selection
  bot.action('clear_selection', async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;

    const userState = userStates.get(userId);
    if (!userState) return;

    userState.selectedServices.clear();

    await ctx.editMessageText(
      'Выберите услуги:',
      getServiceKeyboard(userState.currentCategory, userId)
    );
    await ctx.answerCbQuery('Выбор очищен!');
  });
}; 