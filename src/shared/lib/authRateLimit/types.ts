export type AuthRateLimitRule = {
  scope: string;
  value: string;
  limit: number;
  windowMs: number;
};

export type AuthRateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};
