import { Context } from 'telegraf';
import { messages } from '../utils/messages';
 
export const logoutCommand = async (ctx: Context) => {
  ctx.session = {};
  await ctx.reply(messages.admin.logout);
}; 