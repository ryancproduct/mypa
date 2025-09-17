import winston from 'winston';

const logLevel = process.env.LOG_LEVEL || 'info';

export const createLogger = () => {
  return winston.createLogger({
    level: logLevel,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    defaultMeta: { service: 'mypa-api' },
    transports: [
      // Write all logs with importance level of `error` or less to `error.log`
      new winston.transports.File({ 
        filename: 'logs/error.log', 
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5
      }),
      // Write all logs with importance level of `info` or less to `combined.log`
      new winston.transports.File({ 
        filename: 'logs/combined.log',
        maxsize: 5242880, // 5MB
        maxFiles: 5
      })
    ]
  });
};

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  const logger = createLogger();
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}
