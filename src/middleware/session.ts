import { Context, Middleware } from 'telegraf';

interface SessionData {
  isAdmin?: boolean;
  waitingForPassword?: boolean;
  addingService?: {
    category: string;
    name?: string;
    price?: number;
  };
}

declare module 'telegraf' {
  interface Context {
    session: SessionData;
  }
}

export const session: Middleware<Context> = async (ctx, next) => {
  if (!ctx.session) {
    ctx.session = {};
  }
  return next();
}; 