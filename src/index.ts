import { Telegraf, session } from 'telegraf';
import { config } from 'dotenv';
import { startCommand } from './commands/start';
import { adminCommand } from './commands/admin';
import { setupUserHandlers } from './commands/userHandlers';
import { setupAdminHandlers } from './commands/adminHandlers';
import { logoutCommand } from './commands/logout';
import Redis from 'ioredis';
import { messages } from './utils/messages';
import { cancelCommand } from './commands/cancel';
import { logger } from './utils/logger';

// Load environment variables
config();

// Initialize bot
const bot = new Telegraf(process.env.BOT_TOKEN || '');

// Redis client
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
  password: process.env.REDIS_PASSWORD || undefined,
});

// Session middleware with Redis storage
bot.use(session({
  store: {
    async get(key: string) {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : undefined;
    },
    async set(key: string, value: any) {
      await redis.set(key, JSON.stringify(value));
    },
    async delete(key: string) {
      await redis.del(key);
    }
  }
}));

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
bot.launch().then(() => {
  console.log('Bot started successfully');
  logger.debug('Bot started successfully');
  
  // Additional startup tasks can be added here if necessary
}).catch((error) => {
  console.error('Error starting bot:', error);
  logger.error('Error starting bot', error as Error);
});

// Enable graceful stop
process.once('SIGINT', () => {
  logger.debug('Bot stopping - SIGINT');
  bot.stop('SIGINT');
});
process.once('SIGTERM', () => {
  logger.debug('Bot stopping - SIGTERM');
  bot.stop('SIGTERM');
}); 

