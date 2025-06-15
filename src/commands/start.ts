import { Context } from 'telegraf';
import { Markup } from 'telegraf';
import { messages } from '../utils/messages';

export const startCommand = async (ctx: Context) => {
  const keyboard = Markup.inlineKeyboard([
    [
      Markup.button.callback(messages.user.buttons.car, 'category_car'),
      Markup.button.callback(messages.user.buttons.moto, 'category_moto')
    ],
    [Markup.button.callback(messages.user.buttons.additional, 'category_additional')]
  ]);

  await ctx.reply(
    messages.user.start,
    keyboard
  );
}; 