import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  action: string;
  userId?: number;
  username?: string;
  details?: any;
}

class Logger {
  private logStream: NodeJS.WritableStream | null = null;
  private readonly logDir: string;
  private readonly logFile: string;

  constructor() {
    // Use absolute path from project root
    this.logDir = join(process.cwd(), 'logs');
    
    // Fix date formatting for current timezone
    const now = new Date();
    const offset = -now.getTimezoneOffset();
    const localDate = new Date(now.getTime() + offset * 60 * 1000);
    const dateStr = localDate.toISOString().split('T')[0];
    
    this.logFile = join(this.logDir, `bot_${dateStr}.log`);

    try {
      // Create logs directory if it doesn't exist
      if (!existsSync(this.logDir)) {
        mkdirSync(this.logDir, { recursive: true });
      }

      // Create or append to log file
      this.logStream = createWriteStream(this.logFile, { flags: 'a' });
      
      // Add error handler
      this.logStream.on('error', (error) => {
        console.error('Error writing to log file:', error);
        this.logStream = null;
      });

      // Test write to log file
      this.log('info', 'LOGGER_INITIALIZED', undefined, undefined, { logFile: this.logFile });
      
      // Initialization complete
    } catch (error) {
      console.error('Error initializing logger:', error);
      this.logStream = null;
    }
  }

  private formatLogEntry(entry: LogEntry): string {
    return JSON.stringify({
      ...entry,
      timestamp: new Date().toISOString()
    }) + '\n';
  }

  private log(level: LogLevel, action: string, userId?: number, username?: string, details?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      action,
      userId,
      username,
      details
    };

    const logMessage = this.formatLogEntry(entry);
    
    // Always log to console in development
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[${level.toUpperCase()}] ${action}`, details || '');
    }

    // Try to write to file if stream is available
    if (this.logStream && this.logStream.writable) {
      try {
        this.logStream.write(logMessage);
      } catch (error) {
        console.error('Error writing to log file:', error);
        this.logStream = null;
      }
    }
  }

  // Admin actions
  adminLogin(userId: number, username?: string) {
    this.log('info', 'ADMIN_LOGIN', userId, username);
  }

  adminLogout(userId: number, username?: string) {
    this.log('info', 'ADMIN_LOGOUT', userId, username);
  }

  serviceAdded(userId: number, username: string, category: string, service: { name: string; price: number }) {
    this.log('info', 'SERVICE_ADDED', userId, username, { category, service });
  }

  serviceEdited(userId: number, username: string, category: string, oldService: { name: string; price: number }, newService: { name: string; price: number }) {
    this.log('info', 'SERVICE_EDITED', userId, username, { category, oldService, newService });
  }

  serviceDeleted(userId: number, username: string, category: string, service: { name: string; price: number }) {
    this.log('info', 'SERVICE_DELETED', userId, username, { category, service });
  }

  // User actions
  pdfGenerated(userId: number, username: string, category: string, total: number) {
    this.log('info', 'PDF_GENERATED', userId, username, { category, total });
  }

  // System events
  error(message: string, error: Error, context?: any) {
    this.log('error', 'ERROR', undefined, undefined, { message, error: error.message, stack: error.stack, context });
  }

  warn(message: string, context?: any) {
    this.log('warn', 'WARNING', undefined, undefined, { message, context });
  }

  debug(message: string, context?: any) {
    this.log('debug', 'DEBUG', undefined, undefined, { message, context });
  }
}

export const logger = new Logger(); 