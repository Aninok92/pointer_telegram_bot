import { Context, Markup } from 'telegraf';
import { SessionData, AdminState } from '../types';
import { messages } from '../utils/messages';
import { loadServices, saveServices } from '../utils/services';
import { logger } from '../utils/logger';

const getAdminMenu = () => {
  return Markup.keyboard([
    ['📋 Просмотр услуг', '➕ Добавить услугу'],
    ['✏️ Редактировать услугу', '❌ Удалить услугу'],
    ['📤 Экспорт услуг', '🚪 Выйти']
  ]).resize();
};

export const showAdminMenu = async (ctx: Context & { session: SessionData }) => {
  await ctx.reply(messages.admin.menu, getAdminMenu());
};

export const handleAdminPassword = async (ctx: Context & { session: SessionData }) => {
  const password = (ctx.message as any)?.text;
  if (password === process.env.ADMIN_PASSWORD) {
    ctx.session.isAdmin = true;
    ctx.session.adminState = { step: 'menu' };
    await ctx.reply(messages.admin.welcome, getAdminMenu());
    if (ctx.from?.id) {
      logger.adminLogin(ctx.from.id, ctx.from.username || '');
    }
  } else {
    await ctx.reply(messages.admin.invalidPassword);
    logger.warn('Invalid admin password attempt', { userId: ctx.from?.id, username: ctx.from?.username });
  }
};

export const handleAddService = async (ctx: Context & { session: SessionData }) => {
  try {
    const services = await loadServices();
    const adminState = ctx.session.adminState as AdminState;
    const { category, name, price } = adminState;

    if (!category || !name || !price) {
      throw new Error('Missing required fields');
    }

    if (!services[category]) {
      services[category] = [];
    }

    services[category].push({ name, price });
    await saveServices(services);

    await ctx.reply(messages.admin.serviceAdded, getAdminMenu());
    ctx.session.adminState = { step: 'menu' };
    if (ctx.from?.id) {
      logger.serviceAdded(ctx.from.id, ctx.from.username || '', category, { name, price });
    }
  } catch (error) {
    await ctx.reply(messages.admin.error);
    logger.error('Error adding service', error as Error, { 
      userId: ctx.from?.id, 
      username: ctx.from?.username,
      state: ctx.session.adminState 
    });
  }
};

export const handleEditService = async (ctx: Context & { session: SessionData }) => {
  try {
    const services = await loadServices();
    const adminState = ctx.session.adminState as AdminState;
    const { category, serviceIndex, newName, newPrice } = adminState;

    if (!category || serviceIndex === undefined || !newName || !newPrice) {
      throw new Error('Missing required fields');
    }

    const oldService = services[category][serviceIndex];
    services[category][serviceIndex] = { name: newName, price: newPrice };
    await saveServices(services);

    await ctx.reply(messages.admin.serviceEdited, getAdminMenu());
    ctx.session.adminState = { step: 'menu' };
    if (ctx.from?.id) {
      logger.serviceEdited(
        ctx.from.id, 
        ctx.from.username || '', 
        category, 
        oldService, 
        { name: newName, price: newPrice }
      );
    }
  } catch (error) {
    await ctx.reply(messages.admin.error);
    logger.error('Error editing service', error as Error, { 
      userId: ctx.from?.id, 
      username: ctx.from?.username,
      state: ctx.session.adminState 
    });
  }
};

export const handleDeleteService = async (ctx: Context & { session: SessionData }) => {
  try {
    const services = await loadServices();
    const adminState = ctx.session.adminState as AdminState;
    const { category, serviceIndex } = adminState;

    if (!category || serviceIndex === undefined) {
      throw new Error('Missing required fields');
    }

    const deletedService = services[category][serviceIndex];
    services[category].splice(serviceIndex, 1);
    await saveServices(services);

    await ctx.reply(messages.admin.serviceDeleted(deletedService.name), getAdminMenu());
    ctx.session.adminState = { step: 'menu' };
    if (ctx.from?.id) {
      logger.serviceDeleted(ctx.from.id, ctx.from.username || '', category, deletedService);
    }
  } catch (error) {
    await ctx.reply(messages.admin.error);
    logger.error('Error deleting service', error as Error, { 
      userId: ctx.from?.id, 
      username: ctx.from?.username,
      state: ctx.session.adminState 
    });
  }
};

export const handleLogout = async (ctx: Context & { session: SessionData }) => {
  if (ctx.session.isAdmin && ctx.from?.id) {
    logger.adminLogout(ctx.from.id, ctx.from.username || '');
  }
  ctx.session = { adminState: { step: 'menu' } };
  await ctx.reply(messages.admin.loggedOut);
}; 