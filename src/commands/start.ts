import { Context } from 'telegraf';
import { Markup } from 'telegraf';

export const startCommand = async (ctx: Context) => {
  const keyboard = Markup.inlineKeyboard([
    [
      Markup.button.callback('🚗 Автомобиль', 'category_car'),
      Markup.button.callback('🏍️ Мотоцикл', 'category_moto')
    ],
    [Markup.button.callback('🛠 Доп. услуги', 'category_additional')]
  ]);

  await ctx.reply(
    'Привет! Выберите категорию:',
    keyboard
  );
}; 