import "server-only";

import { isIP } from "node:net";

const MAX_USER_AGENT_LENGTH = 1024;

function getFirstForwardedValue(value: string | null): string | undefined {
  return value?.split(",", 1)[0]?.trim() || undefined;
}

export function getRequestIp(request: Request): string | undefined {
  const isVercel = Boolean(process.env.VERCEL);

  // Outside Vercel, do not trust client-controlled forwarding headers in a
  // production deployment unless a trusted proxy integration is added.
  if (!isVercel && process.env.NODE_ENV === "production") {
    return undefined;
  }

  const forwardedFor = isVercel
    ? request.headers.get("x-vercel-forwarded-for")
    : request.headers.get("x-forwarded-for");

  const candidate =
    getFirstForwardedValue(forwardedFor) ??
    getFirstForwardedValue(request.headers.get("x-real-ip"));

  if (!candidate || isIP(candidate) === 0) {
    return undefined;
  }

  return candidate;
}

export function getRequestUserAgent(request: Request): string | undefined {
  const userAgent = request.headers.get("user-agent")?.trim();

  if (!userAgent) {
    return undefined;
  }

  return userAgent.slice(0, MAX_USER_AGENT_LENGTH);
}
