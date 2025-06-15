import { Context } from 'telegraf';
import { Markup } from 'telegraf';
import 'dotenv/config';
import { env } from 'node:process';
import { messages } from '../utils/messages';

const ADMIN_PASSWORD = env.ADMIN_PASSWORD;
if (!ADMIN_PASSWORD) {
  throw new Error(messages.admin.noPassword);
}

export const adminCommand = async (ctx: Context) => {
  const userId = ctx.from?.id;
  if (!userId) return;

  // Check if the user is already authenticated as admin
  if (ctx.session && (ctx.session as any).isAdmin) {
    await showAdminMenu(ctx);
    return;
  }

  // Request password
  await ctx.reply(messages.admin.enterPassword);
  if (!ctx.session) ctx.session = {};
  (ctx.session as any).waitingForPassword = true;
};

const showAdminMenu = async (ctx: Context) => {
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback(messages.admin.buttons.viewServices, 'admin_view_services')],
    [Markup.button.callback(messages.admin.buttons.addService, 'admin_add_service')],
    [Markup.button.callback(messages.admin.buttons.editService, 'admin_edit_service')],
    [Markup.button.callback(messages.admin.buttons.deleteService, 'admin_delete_service')],
    [Markup.button.callback(messages.admin.buttons.exportJson, 'admin_export_json')]
  ]);

  await ctx.reply(messages.admin.menu, keyboard);
}; 