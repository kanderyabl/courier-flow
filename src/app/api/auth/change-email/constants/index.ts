export const CHANGE_EMAIL_POLICY = {
  stageTtlMs: 5 * 60 * 1_000,
  cooldownMs: 60 * 1_000,
  windowMs: 60 * 60 * 1_000,
  limitPerWindow: 5,
} as const;
