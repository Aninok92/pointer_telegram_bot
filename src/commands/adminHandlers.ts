import { Telegraf, Context } from 'telegraf';
import { Markup } from 'telegraf';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { messages } from '../utils/messages';
import { Service, Services, SessionData } from '../types';

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
    [Markup.button.callback(messages.admin.buttons.viewServices, 'admin_view_services')],
    [Markup.button.callback(messages.admin.buttons.addService, 'admin_add_service')],
    [Markup.button.callback(messages.admin.buttons.editService, 'admin_edit_service')],
    [Markup.button.callback(messages.admin.buttons.deleteService, 'admin_delete_service')],
    [Markup.button.callback(messages.admin.buttons.exportJson, 'admin_export_json')]
  ]);

  await ctx.reply(messages.admin.menu, keyboard);
};

export const setupAdminHandlers = (bot: Telegraf) => {
  // Handle text messages for password and service addition
  bot.on('text', async (ctx) => {
    try {
      // 1. Admin password input
      if (ctx.session?.waitingForPassword) {
        const password = ctx.message.text;
        if (password === process.env.ADMIN_PASSWORD) {
          ctx.session.isAdmin = true;
          ctx.session.waitingForPassword = false;
          await ctx.reply(messages.admin.loginSuccess);
          await showAdminMenu(ctx);
        } else {
          await ctx.reply(messages.admin.wrongPassword);
        }
        return;
      }

      // 2. Adding service
      if (ctx.session?.isAdmin && ctx.session.addingService) {
        if (!ctx.session.addingService.name) {
          ctx.session.addingService.name = ctx.message.text;
          await ctx.reply(messages.admin.enterServicePrice);
        } else if (!ctx.session.addingService.price) {
          const price = parseInt(ctx.message.text);
          if (isNaN(price)) {
            await ctx.reply(messages.admin.enterCorrectNumber);
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
          await ctx.reply(messages.admin.serviceAdded);
          await showAdminMenu(ctx);
        }
        return;
      }

      // 3. Editing service
      if (ctx.session?.isAdmin && ctx.session.editIndex !== undefined && ctx.session.editCategory) {
        const services = loadServices();
        const category = ctx.session.editCategory as keyof Services;
        const idx = ctx.session.editIndex;

        if (ctx.session.editStep === 'name') {
          const newName = ctx.message.text;
          if (newName !== '-') {
            services[category][idx].name = newName;
          }
          ctx.session.editStep = 'price';
          await ctx.reply(messages.admin.enterNewServicePrice);
          return;
        }

        if (ctx.session.editStep === 'price') {
          const newPrice = ctx.message.text;
          if (newPrice !== '-') {
            const price = parseInt(newPrice);
            if (isNaN(price)) {
              await ctx.reply(messages.admin.enterCorrectNumber);
              return;
            }
            services[category][idx].price = price;
          }
          saveServices(services);
          delete ctx.session.editCategory;
          delete ctx.session.editIndex;
          delete ctx.session.editStep;
          await ctx.reply(messages.admin.serviceEdited);
          await showAdminMenu(ctx);
          return;
        }
      }
    } catch (error) {
      console.error('Error in text message handler:', error);
      await ctx.reply(messages.common.error);
    }
  });

  // View services
  bot.action('admin_view_services', async (ctx) => {
    try {
      if (!ctx.session?.isAdmin) return;

      const services = loadServices();
      let message = messages.admin.viewServices;

      for (const [category, categoryServices] of Object.entries(services)) {
        message += `🔹 ${category.toUpperCase()}:\n`;
        categoryServices.forEach((service: Service) => {
          message += `- ${service.name}: ${service.price} MDL\n`;
        });
        message += '\n';
      }

      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback(messages.common.back, 'admin_menu')]
      ]);
      await ctx.editMessageText(message, keyboard);
    } catch (error) {
      console.error('Error viewing services:', error);
      await ctx.reply(messages.common.error);
    }
  });

  // Handle back to admin menu
  bot.action('admin_menu', async (ctx) => {
    try {
      if (!ctx.session?.isAdmin) return;
      await showAdminMenu(ctx);
    } catch (error) {
      console.error('Error returning to admin menu:', error);
      await ctx.reply(messages.common.error);
    }
  });

  // Add service
  bot.action('admin_add_service', async (ctx) => {
    try {
      if (!ctx.session?.isAdmin) return;

      const keyboard = Markup.inlineKeyboard([
        [
          Markup.button.callback(messages.admin.categories.car, 'add_car'),
          Markup.button.callback(messages.admin.categories.moto, 'add_moto')
        ],
        [Markup.button.callback(messages.admin.categories.additional, 'add_additional')]
      ]);

      await ctx.editMessageText(messages.admin.addServiceCategory, keyboard);
    } catch (error) {
      console.error('Error adding service:', error);
      await ctx.reply(messages.common.error);
    }
  });

  // Handle category selection for adding service
  bot.action(/^add_(.+)$/, async (ctx) => {
    try {
      if (!ctx.session?.isAdmin) return;

      const category = ctx.match[1];
      ctx.session.addingService = { category };
      await ctx.editMessageText(messages.admin.enterServiceName);
    } catch (error) {
      console.error('Error selecting category for adding:', error);
      await ctx.reply(messages.common.error);
    }
  });

  // Export JSON
  bot.action('admin_export_json', async (ctx) => {
    try {
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
    } catch (error) {
      console.error('Error exporting JSON:', error);
      await ctx.reply(messages.common.error);
    }
  });

  // 1. Edit service — select category
  bot.action('admin_edit_service', async (ctx) => {
    try {
      if (!ctx.session?.isAdmin) return;

      const keyboard = Markup.inlineKeyboard([
        [
          Markup.button.callback(messages.admin.categories.car, 'edit_car'),
          Markup.button.callback(messages.admin.categories.moto, 'edit_moto')
        ],
        [Markup.button.callback(messages.admin.categories.additional, 'edit_additional')]
      ]);
      await ctx.editMessageText(messages.admin.editServiceCategory, keyboard);
    } catch (error) {
      console.error('Error editing service:', error);
      await ctx.reply(messages.common.error);
    }
  });

  // 2. Select service in category
  bot.action(/^edit_(car|moto|additional)$/, async (ctx) => {
    try {
      if (!ctx.session?.isAdmin) return;
      const category = ctx.match[1];
      ctx.session.editCategory = category;

      const services = loadServices();
      const categoryServices = services[category as keyof Services];

      if (!categoryServices.length) {
        await ctx.editMessageText(messages.admin.noServicesInCategory);
        return;
      }

      const buttons = categoryServices.map((service, idx) =>
        [Markup.button.callback(`${service.name} (${service.price} MDL)`, `edit_service_${idx}`)]
      );
      await ctx.editMessageText(messages.admin.selectServiceToEdit, Markup.inlineKeyboard(buttons));
    } catch (error) {
      console.error('Error selecting service to edit:', error);
      await ctx.reply(messages.common.error);
    }
  });

  // 3. Request new name/price
  bot.action(/^edit_service_(\d+)$/, async (ctx) => {
    try {
      if (!ctx.session?.isAdmin || !ctx.session.editCategory) return;
      const idx = parseInt(ctx.match[1]);
      ctx.session.editIndex = idx;
      ctx.session.editStep = 'name';
      await ctx.editMessageText(messages.admin.enterNewServiceName);
    } catch (error) {
      console.error('Error requesting new service details:', error);
      await ctx.reply(messages.common.error);
    }
  });

  // 1. Delete service — select category
  bot.action('admin_delete_service', async (ctx) => {
    try {
      if (!ctx.session?.isAdmin) return;

      const keyboard = Markup.inlineKeyboard([
        [
          Markup.button.callback(messages.admin.categories.car, 'delete_car'),
          Markup.button.callback(messages.admin.categories.moto, 'delete_moto')
        ],
        [Markup.button.callback(messages.admin.categories.additional, 'delete_additional')]
      ]);
      await ctx.editMessageText(messages.admin.deleteServiceCategory, keyboard);
    } catch (error) {
      console.error('Error deleting service:', error);
      await ctx.reply(messages.common.error);
    }
  });

  // 2. Select service in category for deletion
  bot.action(/^delete_(car|moto|additional)$/, async (ctx) => {
    try {
      if (!ctx.session?.isAdmin) return;
      const category = ctx.match[1];
      ctx.session.deleteCategory = category;

      const services = loadServices();
      const categoryServices = services[category as keyof Services];

      if (!categoryServices.length) {
        await ctx.editMessageText(messages.admin.noServicesInCategory);
        return;
      }

      const buttons = categoryServices.map((service, idx) =>
        [Markup.button.callback(`${service.name} (${service.price} MDL)`, `delete_service_${idx}`)]
      );
      await ctx.editMessageText(messages.admin.selectServiceToDelete, Markup.inlineKeyboard(buttons));
    } catch (error) {
      console.error('Error selecting service to delete:', error);
      await ctx.reply(messages.common.error);
    }
  });

  // 3. Confirm deletion
  bot.action(/^delete_service_(\d+)$/, async (ctx) => {
    try {
      if (!ctx.session?.isAdmin || !ctx.session.deleteCategory) return;
      const idx = parseInt(ctx.match[1]);
      ctx.session.deleteIndex = idx;

      const services = loadServices();
      const category = ctx.session.deleteCategory as keyof Services;
      const service = services[category][idx];

      await ctx.editMessageText(
        messages.admin.confirmDelete(service.name, service.price),
        Markup.inlineKeyboard([
          [Markup.button.callback(messages.admin.buttons.cancelDelete, 'cancel_delete'), 
           Markup.button.callback(messages.admin.buttons.confirmDelete, 'confirm_delete')]
        ])
      );
    } catch (error) {
      console.error('Error confirming deletion:', error);
      await ctx.reply(messages.common.error);
    }
  });

  // 4. Cancel deletion
  bot.action('cancel_delete', async (ctx) => {
    try {
      delete ctx.session.deleteCategory;
      delete ctx.session.deleteIndex;
      await ctx.editMessageText(messages.admin.deleteCancelled);
      await showAdminMenu(ctx);
    } catch (error) {
      console.error('Error cancelling deletion:', error);
      await ctx.reply(messages.common.error);
    }
  });

  // 5. Confirm deletion
  bot.action('confirm_delete', async (ctx) => {
    if (!ctx.session?.isAdmin || ctx.session.deleteIndex === undefined || !ctx.session.deleteCategory) return;
    const services = loadServices();
    const category = ctx.session.deleteCategory as keyof Services;
    const idx = ctx.session.deleteIndex;

    const removed = services[category].splice(idx, 1);
    saveServices(services);

    delete ctx.session.deleteCategory;
    delete ctx.session.deleteIndex;
    await ctx.editMessageText(messages.admin.serviceDeleted(removed[0]?.name || ''));
    await showAdminMenu(ctx);
  });

  bot.command('logout', async (ctx) => {
    ctx.session = {};
    await ctx.reply(messages.admin.logout);
  });
}; 