import { Context, Middleware } from 'telegraf';
import { SessionData } from '../types';

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