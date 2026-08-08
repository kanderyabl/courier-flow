export const RATE_LIMIT_BUCKET_RETENTION_MS = 24 * 60 * 60 * 1_000;
export const RATE_LIMIT_CLEANUP_INTERVAL_MS = 60 * 60 * 1_000;
export const RATE_LIMIT_CLEANUP_RETRY_INTERVAL_MS = 60 * 1_000;
export const RATE_LIMIT_SECRET_MIN_LENGTH = 32;

export const DEVELOPMENT_RATE_LIMIT_SECRET =
  "courier-flow-development-rate-limit-secret-only";
