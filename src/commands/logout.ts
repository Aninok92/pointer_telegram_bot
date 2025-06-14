import { Context } from 'telegraf';

export const logoutCommand = async (ctx: Context) => {
  ctx.session = {};
  await ctx.reply('Вы вышли из админки. Для входа снова потребуется пароль.');
}; 