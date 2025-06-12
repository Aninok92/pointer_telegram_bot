import { Telegraf, Markup } from 'telegraf';
import { services, categories, Service } from './data/services';
import dotenv from 'dotenv';

dotenv.config();

const bot = new Telegraf(process.env.BOT_TOKEN || '');

// Store selected services for each user
const userSelections = new Map<number, Service[]>();

// Helper function to format price
const formatPrice = (price: number): string => {
    return `${price.toLocaleString('ro-RO')} MDL`;
  };

// Helper function to create service keyboard
const createServiceKeyboard = (category: keyof typeof categories) => {
  const categoryServices = services.filter(service => service.category === category);
  const buttons = categoryServices.map(service => [
    Markup.button.callback(
      `${service.name} – ${formatPrice(service.price)}`,
      `service_${service.id}`
    )
  ]);
  
  buttons.push([Markup.button.callback('✅ Завершить выбор', 'finish_selection')]);
  return Markup.inlineKeyboard(buttons);
};

// Start command
bot.command('start', (ctx) => {
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback(categories.car, 'category_car')],
    [Markup.button.callback(categories.motorcycle, 'category_motorcycle')],
    [Markup.button.callback(categories.additional, 'category_additional')]
  ]);

  ctx.reply('Привет! Выберите категорию:', keyboard);
});

// Handle category selection
bot.action(/^category_(.+)$/, (ctx) => {
  const category = ctx.match[1] as keyof typeof categories;
  ctx.editMessageText(
    `Выберите услуги из категории ${categories[category]}:`,
    createServiceKeyboard(category)
  );
});

// Handle service selection
bot.action(/^service_(.+)$/, (ctx) => {
  const serviceId = ctx.match[1];
  const service = services.find(s => s.id === serviceId);
  
  if (!service) return;

  const userId = ctx.from?.id;
  if (!userId) return;

  if (!userSelections.has(userId)) {
    userSelections.set(userId, []);
  }

  const userServices = userSelections.get(userId)!;
  userServices.push(service);

  ctx.answerCbQuery(`Добавлено: ${service.name}`);
});

// Handle finish selection
bot.action('finish_selection', (ctx) => {
  const userId = ctx.from?.id;
  if (!userId) return;

  const selectedServices = userSelections.get(userId) || [];
  
  if (selectedServices.length === 0) {
    ctx.editMessageText('Вы не выбрали ни одной услуги.');
    return;
  }

  const total = selectedServices.reduce((sum, service) => sum + service.price, 0);
  
  const message = [
    'Вы выбрали:',
    ...selectedServices.map(service => 
      `– ${service.name} – ${formatPrice(service.price)}`
    ),
    `\n💰 Общая сумма: ${formatPrice(total)}`
  ].join('\n');

  ctx.editMessageText(message);
  userSelections.delete(userId);
});

// Launch bot
bot.launch().then(() => {
  console.log('Bot started');
}).catch((err) => {
  console.error('Error starting bot:', err);
});

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM')); 