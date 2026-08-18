import "server-only";

import { isIP } from "node:net";

const MAX_USER_AGENT_LENGTH = 1024;
const TRUSTED_PROXY_HEADER_ENV = "TRUSTED_PROXY_HEADER";

const TRUSTED_PROXY_HEADERS = [
  "x-forwarded-for",
  "x-real-ip",
  "x-vercel-forwarded-for",
] as const;

type TrustedProxyHeader = (typeof TRUSTED_PROXY_HEADERS)[number];

export type RequestIpFailureReason =
  | "TRUSTED_PROXY_NOT_CONFIGURED"
  | "TRUSTED_PROXY_HEADER_INVALID"
  | "CLIENT_IP_MISSING_OR_INVALID";

export type RequestIpResolution =
  | {
      ok: true;
      ipAddress: string;
    }
  | {
      ok: false;
      failClosed: boolean;
      reason: RequestIpFailureReason;
    };

function getFirstForwardedValue(value: string | null): string | undefined {
  return value?.split(",", 1)[0]?.trim() || undefined;
}

function isTrustedProxyHeader(value: string): value is TrustedProxyHeader {
  return (TRUSTED_PROXY_HEADERS as readonly string[]).includes(value);
}

function getConfiguredProxyHeader():
  | {
      ok: true;
      header: TrustedProxyHeader | undefined;
    }
  | {
      ok: false;
      reason: RequestIpFailureReason;
    } {
  const configuredHeader = process.env[TRUSTED_PROXY_HEADER_ENV]
    ?.trim()
    .toLowerCase();
  let trustedConfiguredHeader: TrustedProxyHeader | undefined;

  if (configuredHeader) {
    if (!isTrustedProxyHeader(configuredHeader)) {
      return {
        ok: false,
        reason: "TRUSTED_PROXY_HEADER_INVALID",
      };
    }

    trustedConfiguredHeader = configuredHeader;
  }

  if (process.env.VERCEL === "1") {
    return {
      ok: true,
      header: "x-vercel-forwarded-for",
    };
  }

  if (trustedConfiguredHeader) {
    return {
      ok: true,
      header: trustedConfiguredHeader,
    };
  }

  if (process.env.NODE_ENV === "production") {
    return {
      ok: false,
      reason: "TRUSTED_PROXY_NOT_CONFIGURED",
    };
  }

  return {
    ok: true,
    header: undefined,
  };
}

export function resolveRequestIp(request: Request): RequestIpResolution {
  const configuredProxy = getConfiguredProxyHeader();

  if (!configuredProxy.ok) {
    return {
      ok: false,
      failClosed: true,
      reason: configuredProxy.reason,
    };
  }

  const candidates = configuredProxy.header
    ? [getFirstForwardedValue(request.headers.get(configuredProxy.header))]
    : [
        getFirstForwardedValue(request.headers.get("x-forwarded-for")),
        getFirstForwardedValue(request.headers.get("x-real-ip")),
      ];

  const ipAddress = candidates.find(
    (candidate): candidate is string =>
      candidate !== undefined && isIP(candidate) !== 0,
  );

  if (!ipAddress) {
    return {
      ok: false,
      failClosed: process.env.NODE_ENV === "production",
      reason: "CLIENT_IP_MISSING_OR_INVALID",
    };
  }

  return {
    ok: true,
    ipAddress,
  };
}

export function getRequestUserAgent(request: Request): string | undefined {
  const userAgent = request.headers.get("user-agent")?.trim();

  if (!userAgent) {
    return undefined;
  }

  return userAgent.slice(0, MAX_USER_AGENT_LENGTH);
}
