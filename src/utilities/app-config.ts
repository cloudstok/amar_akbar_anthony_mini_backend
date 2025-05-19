import dotenv from "dotenv";
dotenv.config();

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Environment variable ${name} is required but not defined`);
  }
  return value;
}

function requireNumberEnv(name: string): number {
  const value = requireEnv(name);
  const num = Number(value);
  if (isNaN(num)) {
    throw new Error(`Environment variable ${name} must be a valid number`);
  }
  return num;
}

interface DBConfig {
  host: string;
  user: string;
  password: string;
  database: string;
  port: string;
  retries: string;
  interval: string;
}

interface RedisConfig {
  host: string;
  port: number;
  retry: number;
  interval: number;
}

interface AppConfig {
  minBetAmount: number;
  maxBetAmount: number;
  maxCashoutAmount: number;
  dbConfig: DBConfig;
  redis: RedisConfig;
}

export const appConfig: AppConfig = {
  minBetAmount: requireNumberEnv("MIN_BET_AMOUNT"),
  maxBetAmount: requireNumberEnv("MAX_BET_AMOUNT"),
  maxCashoutAmount: requireNumberEnv("MAX_CASHOUT"),
  dbConfig: {
    host: requireEnv("DB_HOST"),
    user: requireEnv("DB_USER"),
    password: requireEnv("DB_PASSWORD"),
    database: requireEnv("DB_NAME"),
    port: requireEnv("DB_PORT"),
    retries: requireEnv("DB_MAX_RETRIES"),
    interval: requireEnv("DB_RETRY_INTERVAL"),
  },
  redis: {
    host: requireEnv("REDIS_HOST"),
    port: requireNumberEnv("REDIS_PORT"),
    retry: requireNumberEnv("REDIS_RETRY"),
    interval: requireNumberEnv("REDIS_RETRY_INTERVAL"),
  },
};
