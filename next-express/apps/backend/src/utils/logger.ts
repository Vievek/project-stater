import winston from 'winston';
import { AsyncLocalStorage } from 'async_hooks';

export const asyncLocalStorage = new AsyncLocalStorage<string>();

const logFormat = winston.format.printf(({ level, message, timestamp, ...metadata }) => {
  const reqId = asyncLocalStorage.getStore();
  let msg = `${timestamp} [${level}]`;
  if (reqId) {
    msg += ` [ReqId: ${reqId}]`;
  }
  msg += `: ${message} `;
  if (Object.keys(metadata).length > 0) {
    msg += JSON.stringify(metadata);
  }
  return msg;
});

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.colorize(),
    logFormat
  ),
  transports: [new winston.transports.Console()],
});
