import "server-only";

import { createHmac } from "node:crypto";

import { getPrisma } from "@/shared/lib/prisma";

import {
  DEVELOPMENT_RATE_LIMIT_SECRET,
  RATE_LIMIT_BUCKET_RETENTION_MS,
  RATE_LIMIT_CLEANUP_INTERVAL_MS,
  RATE_LIMIT_CLEANUP_RETRY_INTERVAL_MS,
  RATE_LIMIT_SECRET_MIN_LENGTH,
} from "./constants";
import type {
  AuthRateLimitResult,
  AuthRateLimitRule,
} from "./types";

let nextCleanupAt = 0;

function getRateLimitSecret(): string {
  const secret = process.env.AUTH_RATE_LIMIT_SECRET?.trim();

  if (secret && secret.length >= RATE_LIMIT_SECRET_MIN_LENGTH) {
    return secret;
  }

  if (process.env.NODE_ENV !== "production") {
    return DEVELOPMENT_RATE_LIMIT_SECRET;
  }

  throw new Error(
    "AUTH_RATE_LIMIT_SECRET must contain at least 32 characters",
  );
}

function hashRateLimitKey(rule: AuthRateLimitRule): string {
  return createHmac("sha256", getRateLimitSecret())
    .update(rule.scope)
    .update("\0")
    .update(rule.value)
    .digest("hex");
}

async function maybeCleanupExpiredBuckets(now: Date): Promise<void> {
  if (now.getTime() < nextCleanupAt) {
    return;
  }

  nextCleanupAt = now.getTime() + RATE_LIMIT_CLEANUP_INTERVAL_MS;

  try {
    await getPrisma().authRateLimitBucket.deleteMany({
      where: {
        expiresAt: {
          lte: now,
        },
      },
    });
  } catch (error) {
    nextCleanupAt =
      now.getTime() + RATE_LIMIT_CLEANUP_RETRY_INTERVAL_MS;
    console.error("Cleaning expired auth rate limits failed:", error);
  }
}

export async function consumeAuthRateLimits(
  rules: AuthRateLimitRule[],
): Promise<AuthRateLimitResult> {
  if (rules.length === 0) {
    return {
      allowed: true,
      retryAfterSeconds: 0,
    };
  }

  const prisma = getPrisma();
  const now = new Date();
  const bucketExpiresAt = new Date(
    now.getTime() + RATE_LIMIT_BUCKET_RETENTION_MS,
  );

  await maybeCleanupExpiredBuckets(now);

  const preparedRules = rules
    .map((rule) => ({
      ...rule,
      keyHash: hashRateLimitKey(rule),
    }))
    .sort((left, right) => left.keyHash.localeCompare(right.keyHash));

  return prisma.$transaction(async (transaction) => {
    for (const rule of preparedRules) {
      const bucket = await transaction.authRateLimitBucket.upsert({
        where: {
          keyHash: rule.keyHash,
        },

        create: {
          keyHash: rule.keyHash,
          attempts: 0,
          windowStartedAt: now,
          expiresAt: bucketExpiresAt,
        },

        update: {
          expiresAt: bucketExpiresAt,
        },

        select: {
          attempts: true,
          windowStartedAt: true,
          blockedUntil: true,
        },
      });

      if (bucket.blockedUntil && bucket.blockedUntil.getTime() > now.getTime()) {
        return {
          allowed: false,
          retryAfterSeconds: Math.max(
            1,
            Math.ceil(
              (bucket.blockedUntil.getTime() - now.getTime()) / 1000,
            ),
          ),
        };
      }

      const windowExpired =
        bucket.windowStartedAt.getTime() + rule.windowMs <= now.getTime();

      const windowStartedAt = windowExpired
        ? now
        : bucket.windowStartedAt;

      const attempts = windowExpired ? 1 : bucket.attempts + 1;
      const windowEndsAt = new Date(
        windowStartedAt.getTime() + rule.windowMs,
      );

      const blockedUntil = attempts > rule.limit ? windowEndsAt : null;

      await transaction.authRateLimitBucket.update({
        where: {
          keyHash: rule.keyHash,
        },

        data: {
          attempts,
          windowStartedAt,
          blockedUntil,
          expiresAt: bucketExpiresAt,
        },
      });

      if (blockedUntil) {
        return {
          allowed: false,
          retryAfterSeconds: Math.max(
            1,
            Math.ceil((blockedUntil.getTime() - now.getTime()) / 1000),
          ),
        };
      }
    }

    return {
      allowed: true,
      retryAfterSeconds: 0,
    };
  });
}

export async function clearAuthRateLimits(
  rules: AuthRateLimitRule[],
): Promise<void> {
  if (rules.length === 0) {
    return;
  }

  const keyHashes = rules.map(hashRateLimitKey);

  await getPrisma().authRateLimitBucket.deleteMany({
    where: {
      keyHash: {
        in: keyHashes,
      },
    },
  });
}
