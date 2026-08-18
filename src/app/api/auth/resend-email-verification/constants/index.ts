export const EMAIL_VERIFICATION_RESEND_POLICY = {
  contextGraceMs: 7 * 24 * 60 * 60 * 1_000,
  cooldownMs: 60 * 1_000,
  windowMs: 60 * 60 * 1_000,
  limitPerWindow: 5,
} as const;

export const EMAIL_VERIFICATION_RESEND_RATE_LIMITS = {
  ip: {
    scope: "resend-email-verification:ip:1h",
    limit: 20,
    windowMs: 60 * 60 * 1_000,
  },
  user: {
    scope: "resend-email-verification:user:1h",
    limit: 5,
    windowMs: 60 * 60 * 1_000,
  },
} as const;
