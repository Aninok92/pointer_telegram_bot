import { Context } from 'telegraf';
import { Markup } from 'telegraf';
import 'dotenv/config';
import { env } from 'node:process';

const ADMIN_PASSWORD = env.ADMIN_PASSWORD;
if (!ADMIN_PASSWORD) {
  throw new Error('ADMIN_PASSWORD is not set! Please add it to your .env file.');
}

export const adminCommand = async (ctx: Context) => {
  const userId = ctx.from?.id;
  if (!userId) return;

  // Проверяем, авторизован ли пользователь как админ
  if (ctx.session && (ctx.session as any).isAdmin) {
    await showAdminMenu(ctx);
    return;
  }

  // Запрашиваем пароль
  await ctx.reply('Введите пароль администратора:');
  if (!ctx.session) ctx.session = {};
  (ctx.session as any).waitingForPassword = true;
};

const showAdminMenu = async (ctx: Context) => {
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback(' 📂 Посмотреть услуги ', 'admin_view_services')],
    [Markup.button.callback(' ➕ Добавить услугу ', 'admin_add_service')],
    [Markup.button.callback(' ✏️ Редактировать услугу ', 'admin_edit_service')],
    [Markup.button.callback(' 🗑 Удалить услугу ', 'admin_delete_service')],
    [Markup.button.callback(' 📁 Экспорт JSON ', 'admin_export_json')]
  ]);

  await ctx.reply('Админ-меню:', keyboard);
}; 