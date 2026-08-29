import winston from "winston";

const isProd = process.env.NODE_ENV === "production";

const SENSITIVE_KEYS = new Set([
  "authcode",
  "auth_code",
  "password",
  "token",
  "jwt",
  "secret",
  "cookie",
  "deepak_auth_code",
  "aman_auth_code",
  "jwt_secret",
  "session_secret",
]);

function redact(meta: Record<string, unknown>): Record<string, unknown> {
  const clean: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(meta)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      clean[key] = "[REDACTED]";
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      clean[key] = redact(value as Record<string, unknown>);
    } else {
      clean[key] = value;
    }
  }

  return clean;
}

const redactFormat = winston.format((info) => {
  const { level, message, timestamp, ...rest } = info;

  const cleaned = redact(rest as Record<string, unknown>);

  return {
    level,
    message,
    timestamp,
    ...cleaned,
  };
});

export const logger = winston.createLogger({
  level: isProd ? "info" : "debug",

  format: winston.format.combine(
    winston.format.timestamp(),
    redactFormat(),
    isProd ? winston.format.json() : winston.format.simple(),
  ),

  transports: [new winston.transports.Console()],
});
