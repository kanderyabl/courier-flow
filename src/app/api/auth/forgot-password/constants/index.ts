export const MAX_FORGOT_PASSWORD_BODY_BYTES = 4 * 1_024;
export const PASSWORD_RESET_TOKEN_TTL_MS = 30 * 60 * 1_000;

export const FORGOT_PASSWORD_RATE_LIMITS = {
  ip: {
    scope: "forgot-password:ip:15m",
    limit: 10,
    windowMs: 15 * 60 * 1_000,
  },
  accountCooldown: {
    scope: "forgot-password:account:1m",
    limit: 1,
    windowMs: 60 * 1_000,
  },
  accountHourly: {
    scope: "forgot-password:account:1h",
    limit: 3,
    windowMs: 60 * 60 * 1_000,
  },
} as const;
