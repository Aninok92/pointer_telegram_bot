import { Telegraf, Context } from 'telegraf';
import { Markup } from 'telegraf';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface Service {
  name: string;
  price: number;
}

interface Services {
  car: Service[];
  moto: Service[];
  additional: Service[];
}

interface SessionData {
  isAdmin?: boolean;
  waitingForPassword?: boolean;
  addingService?: {
    category: string;
    name?: string;
    price?: number;
  };
}

declare module 'telegraf' {
  interface Context {
    session: SessionData;
  }
}

const loadServices = (): Services => {
  const servicesPath = join(__dirname, '../data/services.json');
  return JSON.parse(readFileSync(servicesPath, 'utf-8'));
};

const saveServices = (services: Services) => {
  const servicesPath = join(__dirname, '../data/services.json');
  writeFileSync(servicesPath, JSON.stringify(services, null, 2));
};

const showAdminMenu = async (ctx: Context) => {
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('📂 Посмотреть услуги', 'admin_view_services')],
    [Markup.button.callback('➕ Добавить услугу', 'admin_add_service')],
    [Markup.button.callback('✏️ Редактировать услугу', 'admin_edit_service')],
    [Markup.button.callback('🗑 Удалить услугу', 'admin_delete_service')],
    [Markup.button.callback('📁 Экспорт JSON', 'admin_export_json')]
  ]);

  await ctx.reply('Админ-меню:', keyboard);
};

export const setupAdminHandlers = (bot: Telegraf) => {
  // Handle password input
  bot.on('text', async (ctx) => {
    if (!ctx.session?.waitingForPassword) return;

    const password = ctx.message.text;
    if (password === process.env.ADMIN_PASSWORD) {
      ctx.session.isAdmin = true;
      ctx.session.waitingForPassword = false;
      await showAdminMenu(ctx);
    } else {
      await ctx.reply('Неверный пароль. Попробуйте снова или используйте /admin для выхода.');
    }
  });

  // View services
  bot.action('admin_view_services', async (ctx) => {
    if (!ctx.session?.isAdmin) return;

    const services = loadServices();
    let message = '📋 Список услуг:\n\n';

    for (const [category, categoryServices] of Object.entries(services)) {
      message += `🔹 ${category.toUpperCase()}:\n`;
      categoryServices.forEach((service: Service) => {
        message += `- ${service.name}: ${service.price} MDL\n`;
      });
      message += '\n';
    }

    await ctx.editMessageText(message);
  });

  // Add service
  bot.action('admin_add_service', async (ctx) => {
    if (!ctx.session?.isAdmin) return;

    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback('🚗 Автомобиль', 'add_car'),
        Markup.button.callback('🏍️ Мотоцикл', 'add_moto')
      ],
      [Markup.button.callback('🛠 Доп. услуги', 'add_additional')]
    ]);

    await ctx.editMessageText('Выберите категорию для новой услуги:', keyboard);
  });

  // Handle category selection for adding service
  bot.action(/^add_(.+)$/, async (ctx) => {
    if (!ctx.session?.isAdmin) return;

    const category = ctx.match[1];
    ctx.session.addingService = { category };
    await ctx.editMessageText('Введите название услуги:');
  });

  // Handle service name input
  bot.on('text', async (ctx) => {
    if (!ctx.session?.isAdmin || !ctx.session.addingService) return;

    if (!ctx.session.addingService.name) {
      ctx.session.addingService.name = ctx.message.text;
      await ctx.reply('Введите цену услуги (только число):');
    } else if (!ctx.session.addingService.price) {
      const price = parseInt(ctx.message.text);
      if (isNaN(price)) {
        await ctx.reply('Пожалуйста, введите корректное число:');
        return;
      }

      const services = loadServices();
      const category = ctx.session.addingService.category as keyof Services;
      services[category].push({
        name: ctx.session.addingService.name,
        price
      });
      saveServices(services);

      delete ctx.session.addingService;
      await ctx.reply('✅ Услуга успешно добавлена!');
      await showAdminMenu(ctx);
    }
  });

  // Export JSON
  bot.action('admin_export_json', async (ctx) => {
    if (!ctx.session?.isAdmin) return;

    const services = loadServices();
    const jsonString = JSON.stringify(services, null, 2);
    const fileName = `services_${Date.now()}.json`;
    const filePath = join(__dirname, '../../temp', fileName);

    // Create temp directory if it doesn't exist
    const tempDir = join(__dirname, '../../temp');
    if (!require('fs').existsSync(tempDir)) {
      require('fs').mkdirSync(tempDir);
    }

    writeFileSync(filePath, jsonString);
    await ctx.replyWithDocument({ source: filePath });
  });
}; 