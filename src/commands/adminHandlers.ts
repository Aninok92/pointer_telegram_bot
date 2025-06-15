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
  editCategory?: string;
  editIndex?: number;
  editStep?: string;
  _newName?: string;
  deleteCategory?: string;
  deleteIndex?: number;
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
    [Markup.button.callback(' 📂 Посмотреть услуги ', 'admin_view_services')],
    [Markup.button.callback(' ➕ Добавить услугу ', 'admin_add_service')],
    [Markup.button.callback(' ✏️ Редактировать услугу ', 'admin_edit_service')],
    [Markup.button.callback(' 🗑 Удалить услугу ', 'admin_delete_service')],
    [Markup.button.callback(' 📁 Экспорт JSON ', 'admin_export_json')]
  ]);

  await ctx.reply('Админ-меню:', keyboard);
};

export const setupAdminHandlers = (bot: Telegraf) => {
  // Handle text messages for password and service addition
  bot.on('text', async (ctx) => {
    // 1. Admin password input
    if (ctx.session?.waitingForPassword) {
      const password = ctx.message.text;
      if (password === process.env.ADMIN_PASSWORD) {
        ctx.session.isAdmin = true;
        ctx.session.waitingForPassword = false;
        await ctx.reply('Вход выполнен!');
        await showAdminMenu(ctx);
      } else {
        await ctx.reply('Неверный пароль. Попробуйте снова или используйте /admin для выхода.');
      }
      return;
    }

    // 2. Adding service
    if (ctx.session?.isAdmin && ctx.session.addingService) {
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
      return;
    }

    // 3. Editing service
    if (ctx.session?.isAdmin && ctx.session.editIndex !== undefined && ctx.session.editCategory) {
      const services = loadServices();
      const category = ctx.session.editCategory as keyof Services;
      const idx = ctx.session.editIndex;

      if (ctx.session.editStep === 'name') {
        const newName = ctx.message.text;
        ctx.session._newName = newName;
        ctx.session.editStep = 'price';
        await ctx.reply('Введите новую цену услуги (или отправьте - чтобы не менять):');
        return;
      }

      if (ctx.session.editStep === 'price') {
        const newPrice = ctx.message.text;
        const newName = ctx.session._newName;
        if (newName && newName !== '-') {
          services[category][idx].name = newName;
        }
        if (newPrice !== '-') {
          const price = parseInt(newPrice);
          if (isNaN(price)) {
            await ctx.reply('Пожалуйста, введите корректное число или - чтобы не менять:');
            return;
          }
          services[category][idx].price = price;
        }
        saveServices(services);
        delete ctx.session.editCategory;
        delete ctx.session.editIndex;
        delete ctx.session.editStep;
        delete ctx.session._newName;
        await ctx.reply('✅ Услуга успешно отредактирована!');
        await showAdminMenu(ctx);
        return;
      }
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
        Markup.button.callback(' 🚗 Автомобиль ', 'add_car'),
        Markup.button.callback(' 🏍️ Мотоцикл ', 'add_moto')
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

  // 1. "Edit service" button - category selection
  bot.action('admin_edit_service', async (ctx) => {
    if (!ctx.session?.isAdmin) return;

    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback(' 🚗 Автомобиль ', 'edit_car'),
        Markup.button.callback(' 🏍️ Мотоцикл ', 'edit_moto')
      ],
      [Markup.button.callback('🛠 Доп. услуги', 'edit_additional')]
    ]);
    await ctx.editMessageText('Выберите категорию для редактирования услуги:', keyboard);
  });

  // 2. Service selection in category
  bot.action(/^edit_(car|moto|additional)$/, async (ctx) => {
    if (!ctx.session?.isAdmin) return;
    const category = ctx.match[1];
    ctx.session.editCategory = category;

    const services = loadServices();
    const categoryServices = services[category as keyof Services];

    if (!categoryServices.length) {
      await ctx.editMessageText('В этой категории нет услуг для редактирования.');
      return;
    }

    const buttons = categoryServices.map((service, idx) =>
      [Markup.button.callback(`${service.name} - ${service.price} MDL`, `edit_service_${idx}`)]
    );
    await ctx.editMessageText('Выберите услугу для редактирования:', Markup.inlineKeyboard(buttons));
  });

  // 3. Request new name/price
  bot.action(/^edit_service_(\d+)$/, async (ctx) => {
    if (!ctx.session?.isAdmin || !ctx.session.editCategory) return;
    const idx = parseInt(ctx.match[1]);
    ctx.session.editIndex = idx;
    ctx.session.editStep = 'name';
    await ctx.editMessageText('Введите новое название услуги (или отправьте - чтобы не менять):');
  });

  // 1. "Delete service" button - category selection
  bot.action('admin_delete_service', async (ctx) => {
    if (!ctx.session?.isAdmin) return;

    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback(' 🚗 Автомобиль ', 'delete_car'),
        Markup.button.callback(' 🏍️ Мотоцикл ', 'delete_moto')
      ],
      [Markup.button.callback('🛠 Доп. услуги', 'delete_additional')]
    ]);
    await ctx.editMessageText('Выберите категорию для удаления услуги:', keyboard);
  });

  // 2. Service selection in category
  bot.action(/^delete_(car|moto|additional)$/, async (ctx) => {
    if (!ctx.session?.isAdmin) return;
    const category = ctx.match[1];
    ctx.session.deleteCategory = category;

    const services = loadServices();
    const categoryServices = services[category as keyof Services];

    if (!categoryServices.length) {
      await ctx.editMessageText('В этой категории нет услуг для удаления.');
      return;
    }

    const buttons = categoryServices.map((service, idx) =>
      [Markup.button.callback(`${service.name} (${service.price} MDL)`, `delete_service_${idx}`)]
    );
    await ctx.editMessageText('Выберите услугу для удаления:', Markup.inlineKeyboard(buttons));
  });

  // 3. Confirm deletion
  bot.action(/^delete_service_(\d+)$/, async (ctx) => {
    if (!ctx.session?.isAdmin || !ctx.session.deleteCategory) return;
    const idx = parseInt(ctx.match[1]);
    ctx.session.deleteIndex = idx;

    const services = loadServices();
    const category = ctx.session.deleteCategory as keyof Services;
    const service = services[category][idx];

    await ctx.editMessageText(
      `Вы уверены, что хотите удалить услугу "${service.name}" - ${service.price} MDL?`,
      Markup.inlineKeyboard([
        [Markup.button.callback('❌ Нет', 'cancel_delete'), Markup.button.callback('✅ Да, удалить', 'confirm_delete')]
      ])
    );
  });

  // 4. Cancel deletion
  bot.action('cancel_delete', async (ctx) => {
    delete ctx.session.deleteCategory;
    delete ctx.session.deleteIndex;
    await ctx.editMessageText('Удаление отменено.');
    await showAdminMenu(ctx);
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
    await ctx.editMessageText(`✅ Услуга "${removed[0]?.name}" удалена!`);
    await showAdminMenu(ctx);
  });

  bot.command('logout', async (ctx) => {
    ctx.session = {};
    await ctx.reply('Вы вышли из админки. Для входа снова потребуется пароль.');
  });
}; 