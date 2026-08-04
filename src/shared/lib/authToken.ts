import "server-only";

import { createHash, randomBytes } from "node:crypto";

const AUTH_TOKEN_BYTES = 32;

export function hashAuthToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function createAuthToken(): {
  token: string;
  tokenHash: string;
} {
  const token = randomBytes(AUTH_TOKEN_BYTES).toString("base64url");

  return {
    token,
    tokenHash: hashAuthToken(token),
  };
}
