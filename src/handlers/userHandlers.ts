import { Context, Markup } from 'telegraf';
import { SessionData } from '../types';
import { messages } from '../utils/messages';
import { loadServices } from '../utils/services';
import { generateInvoice } from '../utils/generateInvoice';
import { logger } from '../utils/logger';

const getMainMenu = () => {
  return Markup.keyboard([
    [messages.user.buttons.car, messages.user.buttons.moto],
    [messages.user.buttons.additional],
    [messages.user.buttons.clearSelection, messages.user.buttons.finishSelection]
  ]).resize();
};

export const handleFinishSelection = async (ctx: Context & { session: SessionData }) => {
  try {
    const { selectedServices } = ctx.session;
    if (!selectedServices || Object.keys(selectedServices).length === 0) {
      await ctx.reply(messages.common.error);
      return;
    }

    const services = await loadServices();
    let total = 0;
    const summary: { [key: string]: { name: string; quantity: number; price: number }[] } = {};

    for (const [category, items] of Object.entries(selectedServices)) {
      summary[category] = [];
      for (const [index, quantity] of Object.entries(items)) {
        if (quantity > 0) {
          const service = services[category][parseInt(index)];
          const itemTotal = service.price * quantity;
          total += itemTotal;
          summary[category].push({
            name: service.name,
            quantity,
            price: service.price
          });
        }
      }
    }

    const pdfPath = await generateInvoice(summary, total);
    await ctx.replyWithDocument({ source: pdfPath });
    await ctx.reply(messages.user.finishSelection, getMainMenu());

    if (ctx.from?.id) {
      logger.pdfGenerated(ctx.from.id, ctx.from.username || '', Object.keys(summary).join(', '), total);
    }

    ctx.session.selectedServices = {};
  } catch (error) {
    await ctx.reply(messages.common.error);
    logger.error('Error generating PDF', error as Error, { 
      userId: ctx.from?.id, 
      username: ctx.from?.username,
      selectedServices: ctx.session.selectedServices 
    });
  }
};

export const handleClearSelection = async (ctx: Context & { session: SessionData }) => {
  try {
    ctx.session.selectedServices = {};
    await ctx.reply(messages.user.clearSelection, getMainMenu());
    logger.debug('Selection cleared', { 
      userId: ctx.from?.id, 
      username: ctx.from?.username || '' 
    });
  } catch (error) {
    await ctx.reply(messages.common.error);
    logger.error('Error clearing selection', error as Error, { 
      userId: ctx.from?.id, 
      username: ctx.from?.username 
    });
  }
}; 