import fs, { WriteStream } from 'fs';
import path from 'path';
import pino, { LoggerOptions, Logger, Level } from 'pino';

type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

const colors: Record<LogLevel | 'reset', string> = {
  trace: '\x1b[37m',
  debug: '\x1b[36m',
  info: '\x1b[32m',
  warn: '\x1b[33m',
  error: '\x1b[31m',
  fatal: '\x1b[35m',
  reset: '\x1b[0m',
};

interface LogEntry {
  time: number;
  level: LogLevel;
  name: string;
  msg: string;
}

function prettyPrint(log: LogEntry): string {
  const timestamp = new Date(log.time).toISOString();
  const color = colors[log.level] || colors.info;
  return `${timestamp} ${color}[${log.name}] ${log.level}: ${log.msg}${colors.reset}`;
}

const prettyStream = {
  write: (chunk: string): void => {
    try {
      const log: LogEntry = JSON.parse(chunk);
      console.log(prettyPrint(log));
    } catch (err) {
      console.error('[LOGGER ERROR] Failed to parse log:', err);
    }
  }
};


const jsonlStream = (filePath: string): WriteStream =>
  fs.createWriteStream(filePath, { flags: 'a' });

export function createLogger(moduleName: string, format: 'plain' | 'jsonl' = 'plain'): Logger {
  const logDir = 'logs';
  const jsonlFilePath = path.join(logDir, `${moduleName}.jsonl`);
  const logFilePath = path.join(logDir, `${moduleName}.log`);

  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const logFileStream: WriteStream = format === 'jsonl'
    ? jsonlStream(jsonlFilePath)
    : fs.createWriteStream(logFilePath, { flags: 'a' });

  const options: LoggerOptions = {
    formatters: {
      level(label: string) {
        return { level: label };
      },
    },
    base: { name: moduleName },
  };

  return pino(options, pino.multistream([
    { stream: prettyStream },
    { stream: logFileStream },
  ]));
}
