export const MAX_RESET_PASSWORD_BODY_BYTES = 4 * 1_024;

export const RESET_PASSWORD_RATE_LIMITS = {
  ip: {
    scope: "reset-password:ip:15m",
    limit: 20,
    windowMs: 15 * 60 * 1_000,
  },
  token: {
    scope: "reset-password:token:15m",
    limit: 5,
    windowMs: 15 * 60 * 1_000,
  },
} as const;
