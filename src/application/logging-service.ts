const win = require('winston');
const { format } = require('winston');
const { combine, timestamp, json, simple, prettyPrint, colorize, align } = format;

require('winston-daily-rotate-file');

const rotateTransport = new win.transports.DailyRotateFile({
    filename: 'bittery-backend-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    directory: 'logs',
});

// @ts-ignore
const logger = win.createLogger({
    level: 'debug',
    format: combine(
        timestamp({ format:'YYYY-MM-DD HH:mm:ss.SSS' }),
        prettyPrint(),
        json(),
        colorize(),
    ),
    transports: [
        new win.transports.File({ filename: 'logs/error.log', level: 'error' }),
        rotateTransport,
    ],
});

//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//
if (process.env.NODE_ENV !== 'production') {
    logger.add(new win.transports.Console({
        format: simple(),
    }));
}

export const logInfo = (message: string): void => {
    logger.info(message);
};

export const logWarn = (message: string): void => {
    logger.warn(message);
};

export const logError = (message: string, ...others: any[]): void => {
    if (others) {
        for (const singleOther of others) {
            if (singleOther instanceof Error) {
                // tslint:disable-next-line:no-parameter-reassignment
                message = `${message} ${singleOther.stack}`;
            } else {
                // tslint:disable-next-line:no-parameter-reassignment
                message = `${message}. ${singleOther}`;
            }
        }
    }
    logger.error(message);
};
