export const MAX_SIGN_IN_BODY_BYTES = 4 * 1_024;
export const SESSION_TOKEN_GENERATION_ATTEMPTS = 2;

export const SIGN_IN_RATE_LIMITS = {
  pair: {
    scope: "sign-in:pair:15m",
    limit: 5,
    windowMs: 15 * 60 * 1_000,
  },
  account: {
    scope: "sign-in:account:15m",
    limit: 10,
    windowMs: 15 * 60 * 1_000,
  },
  ipBurst: {
    scope: "sign-in:ip:5m",
    limit: 30,
    windowMs: 5 * 60 * 1_000,
  },
  ipHourly: {
    scope: "sign-in:ip:1h",
    limit: 100,
    windowMs: 60 * 60 * 1_000,
  },
} as const;
