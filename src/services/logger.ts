// Enhanced logging service for development and debugging
class Logger {
  private static instance: Logger;
  private isDev = import.meta.env.DEV;
  
  private constructor() {}
  
  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }
  
  private formatMessage(level: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    return data ? `${prefix} ${message} - Data:` : `${prefix} ${message}`;
  }
  
  info(message: string, data?: any) {
    if (this.isDev) {
      console.info(this.formatMessage('info', message), data || '');
    }
  }
  
  error(message: string, error?: any) {
    console.error(this.formatMessage('error', message), error || '');
  }
  
  warn(message: string, data?: any) {
    if (this.isDev) {
      console.warn(this.formatMessage('warn', message), data || '');
    }
  }
  
  debug(message: string, data?: any) {
    if (this.isDev) {
      console.debug(this.formatMessage('debug', message), data || '');
    }
  }
  
  // API specific logging
  apiRequest(method: string, url: string, data?: any) {
    this.debug(`API Request: ${method} ${url}`, data);
  }
  
  apiResponse(method: string, url: string, status: number, data?: any) {
    if (status >= 200 && status < 300) {
      this.info(`API Success: ${method} ${url} (${status})`, data);
    } else {
      this.error(`API Error: ${method} ${url} (${status})`, data);
    }
  }
  
  // User Context logging
  userAction(action: string, data?: any) {
    this.info(`User Action: ${action}`, data);
  }
  
  // Anonymous account creation logging
  accountCreation(step: string, data?: any) {
    this.info(`Account Creation - ${step}`, data);
  }
}

export const logger = Logger.getInstance();