import { Context } from 'telegraf';
import { messages } from '../utils/messages';
import { Markup } from 'telegraf';

export const cancelCommand = async (ctx: Context) => {
  const session = ctx.session;
  if (!session) {
    await ctx.reply(messages.common.error);
    return;
  }

  // If the user is in the process of adding a service
  if (session.addingService) {
    delete session.addingService;
    await ctx.reply(messages.admin.addCancelled);
    if (session.isAdmin) {
      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback(messages.admin.buttons.viewServices, 'admin_view_services')],
        [Markup.button.callback(messages.admin.buttons.addService, 'admin_add_service')],
        [Markup.button.callback(messages.admin.buttons.editService, 'admin_edit_service')],
        [Markup.button.callback(messages.admin.buttons.deleteService, 'admin_delete_service')],
        [Markup.button.callback(messages.admin.buttons.exportJson, 'admin_export_json')]
      ]);
      await ctx.reply(messages.admin.menu, keyboard);
    } else {
      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback(messages.user.buttons.car, 'category_car')],
        [Markup.button.callback(messages.user.buttons.moto, 'category_moto')],
        [Markup.button.callback(messages.user.buttons.additional, 'category_additional')]
      ]);
      await ctx.reply(messages.user.start, keyboard);
    }
    return;
  }

  // If the user is in the process of editing a service
  if (session.editCategory || session.editIndex !== undefined || session.editStep) {
    delete session.editCategory;
    delete session.editIndex;
    delete session.editStep;
    await ctx.reply(messages.admin.editCancelled);
    if (session.isAdmin) {
      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback(messages.admin.buttons.viewServices, 'admin_view_services')],
        [Markup.button.callback(messages.admin.buttons.addService, 'admin_add_service')],
        [Markup.button.callback(messages.admin.buttons.editService, 'admin_edit_service')],
        [Markup.button.callback(messages.admin.buttons.deleteService, 'admin_delete_service')],
        [Markup.button.callback(messages.admin.buttons.exportJson, 'admin_export_json')]
      ]);
      await ctx.reply(messages.admin.menu, keyboard);
    } else {
      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback(messages.user.buttons.car, 'category_car')],
        [Markup.button.callback(messages.user.buttons.moto, 'category_moto')],
        [Markup.button.callback(messages.user.buttons.additional, 'category_additional')]
      ]);
      await ctx.reply(messages.user.start, keyboard);
    }
    return;
  }

  // If the user is in the process of deleting a service
  if (session.deleteCategory || session.deleteIndex !== undefined) {
    delete session.deleteCategory;
    delete session.deleteIndex;
    await ctx.reply(messages.admin.deleteCancelled);
    if (session.isAdmin) {
      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback(messages.admin.buttons.viewServices, 'admin_view_services')],
        [Markup.button.callback(messages.admin.buttons.addService, 'admin_add_service')],
        [Markup.button.callback(messages.admin.buttons.editService, 'admin_edit_service')],
        [Markup.button.callback(messages.admin.buttons.deleteService, 'admin_delete_service')],
        [Markup.button.callback(messages.admin.buttons.exportJson, 'admin_export_json')]
      ]);
      await ctx.reply(messages.admin.menu, keyboard);
    } else {
      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback(messages.user.buttons.car, 'category_car')],
        [Markup.button.callback(messages.user.buttons.moto, 'category_moto')],
        [Markup.button.callback(messages.user.buttons.additional, 'category_additional')]
      ]);
      await ctx.reply(messages.user.start, keyboard);
    }
    return;
  }

  // If the user is waiting for the admin password
  if (session.waitingForPassword) {
    delete session.waitingForPassword;
    await ctx.reply(messages.admin.passwordCancelled);
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback(messages.user.buttons.car, 'category_car')],
      [Markup.button.callback(messages.user.buttons.moto, 'category_moto')],
      [Markup.button.callback(messages.user.buttons.additional, 'category_additional')]
    ]);
    await ctx.reply(messages.user.start, keyboard);
    return;
  }

  // If there is no active operation, just inform the user
  await ctx.reply(messages.admin.noActiveOperation);
}; 