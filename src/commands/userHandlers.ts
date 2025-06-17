import { Telegraf, Context } from 'telegraf';
import { Markup } from 'telegraf';
import { readFileSync } from 'fs';
import { join } from 'path';
import { generateInvoice } from '../pdf/generateInvoice';
import { existsSync, mkdirSync } from 'fs';
import { messages } from '../utils/messages';
import { Service, Services, UserState } from '../types';

const userStates = new Map<number, UserState>();

const loadServices = (): Services => {
  const servicesPath = join(__dirname, '../data/services.json');
  return JSON.parse(readFileSync(servicesPath, 'utf-8'));
};

const getServiceKeyboard = (category: string, userId: number) => {
  const services = loadServices();
  const categoryServices = services[category as keyof Services];
  const userState = userStates.get(userId) || { selectedServices: new Map(), currentCategory: category };

  const buttons = categoryServices.map((service, idx) => {
    const quantity = userState.selectedServices.get(service.name) || 0;
    const buttonText = quantity > 0
      ? `✔️ ${service.name} – ${service.price} MDL ×${quantity}`
      : `${service.name} – ${service.price} MDL`;
    return [Markup.button.callback(buttonText, `service_${category}_${idx}`)];
  });

  if (userState.selectedServices.size > 0) {
    buttons.push([
      Markup.button.callback(messages.user.buttons.clearSelection, 'clear_selection'),
      Markup.button.callback(messages.user.buttons.finishSelection, 'finish_selection')
    ]);
  }

  return Markup.inlineKeyboard(buttons);
};

export const setupUserHandlers = (bot: Telegraf) => {
  // Handle category selection
  bot.action(/^category_(.+)$/, async (ctx) => {
    try {
      const category = ctx.match[1];
      const userId = ctx.from?.id;
      
      if (!userId) return;

      if (!userStates.has(userId)) {
        userStates.set(userId, { selectedServices: new Map(), currentCategory: category });
      } else {
        userStates.get(userId)!.currentCategory = category;
      }

      await ctx.editMessageText(
        messages.user.selectServices,
        getServiceKeyboard(category, userId)
      );
    } catch (error) {
      console.error('Error in category selection:', error);
      await ctx.reply(messages.common.error);
    }
  });

  // Handle service selection
  bot.action(/^service_(.+)_(\d+)$/, async (ctx) => {
    try {
      const [_, category, idxStr] = ctx.match;
      const idx = parseInt(idxStr);
      const userId = ctx.from?.id;
      if (!userId) return;
      const userState = userStates.get(userId);
      if (!userState) return;
      const services = loadServices();
      const service = services[category as keyof Services][idx];
      if (!service) return;
      const currentQuantity = userState.selectedServices.get(service.name) || 0;
      userState.selectedServices.set(service.name, currentQuantity + 1);
      await ctx.editMessageText(
        messages.user.selectServices,
        getServiceKeyboard(category, userId)
      );
    } catch (error) {
      console.error('Error in service selection:', error);
      await ctx.reply(messages.common.error);
    }
  });

  // Handle finish selection
  bot.action('finish_selection', async (ctx) => {
    try {
      const userId = ctx.from?.id;
      if (!userId) return;

      const userState = userStates.get(userId);
      if (!userState) return;

      const services = loadServices();
      let total = 0;
      let message = messages.user.finishSelection + '\n';

      for (const [serviceName, quantity] of userState.selectedServices.entries()) {
        const service = services[userState.currentCategory as keyof Services]
          .find(s => s.name === serviceName);
        
        if (service) {
          const serviceTotal = service.price * quantity;
          total += serviceTotal;
          message += `– ${serviceName} ×${quantity} – ${serviceTotal} ${messages.pdf.currency}\n`;
        }
      }

      message += messages.user.total(total);

      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback(messages.user.getPdf, 'generate_pdf')]
      ]);

      await ctx.editMessageText(message, keyboard);
    } catch (error) {
      console.error('Error in finish selection:', error);
      await ctx.reply(messages.common.error);
    }
  });

  // Handle PDF generation
  bot.action('generate_pdf', async (ctx) => {
    try {
      const userId = ctx.from?.id;
      if (!userId) return;

      const userState = userStates.get(userId);
      if (!userState) return;

      const services = loadServices();
      let total = 0;

      for (const [serviceName, quantity] of userState.selectedServices.entries()) {
        const service = services[userState.currentCategory as keyof Services]
          .find(s => s.name === serviceName);
        
        if (service) {
          total += service.price * quantity;
        }
      }

      await ctx.answerCbQuery(messages.user.pdfGenerating);
      
      // Create temp directory if it doesn't exist
      const tempDir = join(__dirname, '../../temp');
      if (!existsSync(tempDir)) {
        mkdirSync(tempDir, { recursive: true });
      }

      const pdfPath = await generateInvoice(
        userState.selectedServices,
        total,
        userState.currentCategory
      );
      
      if (!existsSync(pdfPath)) {
        throw new Error(messages.pdf.fileNotCreated);
      }

      await ctx.replyWithDocument({ source: pdfPath });
      await ctx.answerCbQuery(messages.user.pdfSuccess);
    } catch (error) {
      console.error('Error generating PDF:', error);
      await ctx.answerCbQuery(messages.user.pdfError);
      await ctx.reply(messages.common.error);
    }
  });

  // Handle clearing selection
  bot.action('clear_selection', async (ctx) => {
    try {
      const userId = ctx.from?.id;
      if (!userId) return;

      const userState = userStates.get(userId);
      if (!userState) return;

      userState.selectedServices.clear();

      await ctx.editMessageText(
        messages.user.selectServices,
        getServiceKeyboard(userState.currentCategory, userId)
      );
      await ctx.answerCbQuery(messages.user.clearSelection);
    } catch (error) {
      console.error('Error clearing selection:', error);
      await ctx.reply(messages.common.error);
    }
  });
}; 