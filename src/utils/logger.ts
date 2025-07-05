import { createLogger, format, transports, Logger } from "winston";
import { TransformableInfo } from "logform";
const { combine, timestamp, json, colorize, printf } = format;

const consoleLogFormat = printf((info: TransformableInfo) => {
  const { level, message, timestamp } = info as {
    level: string;
    message: string;
    timestamp?: string;
  };
  return `${timestamp ? `[${timestamp}] ` : ""}${level}: ${message}`;
});

const logger: Logger = createLogger({
  level: "info",
  format: combine(colorize(), timestamp(), json()),
  transports: [
    new transports.Console({
      format: consoleLogFormat,
    }),
    new transports.File({ filename: "app.log" }),
  ],
});

export default logger;


export const morganOptions = {
    stream: {
        write: (message: string) => {
            const [method, url, status, responseTime] = message.split(" ");

            const logObject = {
                Method: method,
                URL: url,
                Status: status,
                "Response Time (ms)": responseTime,
            };

            logger.info(JSON.stringify(logObject, null, 2));
        },
    },
};