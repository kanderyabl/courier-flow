export const MAX_SIGN_UP_BODY_BYTES = 4 * 1_024;

export const SIGN_UP_RATE_LIMITS = {
  ipBurst: {
    scope: "sign-up:ip:15m",
    limit: 5,
    windowMs: 15 * 60 * 1_000,
  },
  ipHourly: {
    scope: "sign-up:ip:1h",
    limit: 20,
    windowMs: 60 * 60 * 1_000,
  },
} as const;
