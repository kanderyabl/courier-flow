export const EMAIL_VERIFICATION_RESEND_POLICY = {
  contextGraceMs: 7 * 24 * 60 * 60 * 1_000,
  cooldownMs: 60 * 1_000,
  windowMs: 60 * 60 * 1_000,
  limitPerWindow: 5,
} as const;
