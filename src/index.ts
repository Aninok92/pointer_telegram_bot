import { Telegraf, session } from 'telegraf';
import { config } from 'dotenv';
import { startCommand } from './commands/start';
import { adminCommand } from './commands/admin';
import { setupUserHandlers } from './commands/userHandlers';
import { setupAdminHandlers } from './commands/adminHandlers';
import { logoutCommand } from './commands/logout';
import { messages } from './utils/messages';
import { cancelCommand } from './commands/cancel';
import { logger } from './utils/logger';

// Load environment variables
config();

// Initialize bot
const bot = new Telegraf(process.env.BOT_TOKEN || '');

// Session middleware (in-memory)
bot.use(session());

// Register commands
bot.command('start', startCommand);
bot.command('admin', adminCommand);
bot.command('logout', logoutCommand);
bot.command('cancel', cancelCommand);

// Setup handlers
setupUserHandlers(bot);
setupAdminHandlers(bot);

// Set bot command menu for Telegram UI
bot.telegram.setMyCommands([
  { command: 'start', description: messages.commands.start },
  { command: 'admin', description: messages.commands.admin },
  { command: 'logout', description: messages.commands.logout },
  { command: 'cancel', description: messages.commands.cancel }
]);

// Start bot
const isProduction = process.env.RENDER || process.env.NODE_ENV === 'production';

if (isProduction) {
  // Для Render/webhook
  const domain = process.env.RENDER_EXTERNAL_URL || process.env.RENDER_DOMAIN || process.env.WEBHOOK_DOMAIN;
  const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
  if (!domain) {
    throw new Error('WEBHOOK_DOMAIN (RENDER_EXTERNAL_URL) is not set for webhook mode');
  }
  bot.launch({
    webhook: {
      domain,
      port,
    }
  }).then(() => {
    console.log(`Bot started in webhook mode at ${domain}:${port}`);
    logger.debug(`Bot started in webhook mode at ${domain}:${port}`);
  }).catch((error) => {
    console.error('Error starting bot (webhook):', error);
    logger.error('Error starting bot (webhook)', error as Error);
  });
} else {
  // Локально — polling
  bot.launch().then(() => {
    console.log('Bot started in polling mode');
    logger.debug('Bot started in polling mode');
  }).catch((error) => {
    console.error('Error starting bot (polling):', error);
    logger.error('Error starting bot (polling)', error as Error);
  });
}

// Enable graceful stop
process.once('SIGINT', () => {
  logger.debug('Bot stopping - SIGINT');
  bot.stop('SIGINT');
});
process.once('SIGTERM', () => {
  logger.debug('Bot stopping - SIGTERM');
  bot.stop('SIGTERM');
}); 

 