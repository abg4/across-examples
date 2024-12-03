import { createLogger, format, transports } from 'winston';

const { combine, printf, colorize } = format;

export const logger = createLogger({
  level: 'info',
  format: combine(
    colorize(),
    printf((info) => {
      return `[${info.level}] : ${JSON.stringify(info.message)}`;
    })
  ),
  transports: [
    //
    // - Write all logs with importance level of `info` or higher to `combined.log`
    //   (i.e., fatal, error, warn, and info, but not trace)
    //
    new transports.Console({ format: format.simple() }),
  ],
});
