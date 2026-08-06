"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";

import { VerifyEmailCard } from "./VerifyEmailCard";

import type {
  VerifyEmailCardContainerProps,
  ResendEmailApiResponse,
} from "../types";

const DEFAULT_RESEND_DELAY_SECONDS = 60;

function normalizeRetryAfterSeconds(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.ceil(value));
}

export function VerifyEmailCardContainer({
  email,
  token,
}: VerifyEmailCardContainerProps) {
  const locale = useLocale();

  const [resendAvailableAt, setResendAvailableAt] = useState<number | null>(
    null,
  );

  const [currentTime, setCurrentTime] = useState(() => Date.now());

  const [isStatusLoading, setIsStatusLoading] = useState(true);

  const [isResending, setIsResending] = useState(false);

  const [isResent, setIsResent] = useState(false);

  const [hasResendError, setHasResendError] = useState(false);

  const statusUrl = useMemo(() => {
    const searchParams = new URLSearchParams();

    if (token) {
      searchParams.set("token", token);
    }

    const query = searchParams.toString();

    return query
      ? `/api/auth/resend-email-verification?${query}`
      : "/api/auth/resend-email-verification";
  }, [token]);

  const setCooldown = useCallback((retryAfterSeconds: number) => {
    const now = Date.now();

    setCurrentTime(now);

    setResendAvailableAt(now + retryAfterSeconds * 1000);
  }, []);

  const secondsLeft = useMemo(() => {
    if (resendAvailableAt === null) {
      return 0;
    }

    return Math.max(0, Math.ceil((resendAvailableAt - currentTime) / 1000));
  }, [currentTime, resendAvailableAt]);

  const fetchResendStatus = useCallback(
    async (signal?: AbortSignal): Promise<ResendEmailApiResponse> => {
      const response = await fetch(statusUrl, {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
        signal,
      });

      const data = (await response
        .json()
        .catch(() => null)) as ResendEmailApiResponse | null;

      if (!response.ok) {
        throw new Error(data?.code ?? "RESEND_STATUS_REQUEST_FAILED");
      }

      return data ?? {};
    },
    [statusUrl],
  );

  const applyResendStatus = useCallback(
    (data: ResendEmailApiResponse) => {
      const retryAfterSeconds = normalizeRetryAfterSeconds(
        data.retryAfterSeconds,
      );

      setCooldown(retryAfterSeconds);
      setHasResendError(false);
    },
    [setCooldown],
  );

  useEffect(() => {
    const controller = new AbortController();

    fetchResendStatus(controller.signal)
      .then((data) => {
        if (controller.signal.aborted) {
          return;
        }

        applyResendStatus(data);
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        console.error("Getting resend status failed:", error);

        setHasResendError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsStatusLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [applyResendStatus, fetchResendStatus]);

  useEffect(() => {
    if (resendAvailableAt === null || resendAvailableAt <= Date.now()) {
      return;
    }

    const timerId = window.setInterval(() => {
      setCurrentTime(Date.now());
    }, 250);

    return () => {
      window.clearInterval(timerId);
    };
  }, [resendAvailableAt]);

  useEffect(() => {
    const synchronize = () => {
      fetchResendStatus()
        .then((data) => {
          applyResendStatus(data);
        })
        .catch((error: unknown) => {
          console.error("Resynchronizing resend status failed:", error);

          setHasResendError(true);
        });
    };

    const handleFocus = () => {
      synchronize();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        synchronize();
      }
    };

    window.addEventListener("focus", handleFocus);

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", handleFocus);

      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [applyResendStatus, fetchResendStatus]);

  const handleResend = async (): Promise<void> => {
    if (isStatusLoading || isResending || secondsLeft > 0) {
      return;
    }

    setIsResending(true);
    setIsResent(false);
    setHasResendError(false);

    try {
      const response = await fetch("/api/auth/resend-email-verification", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        credentials: "same-origin",

        body: JSON.stringify({
          ...(token ? { token } : {}),
          locale,
        }),
      });

      const data = (await response
        .json()
        .catch(() => null)) as ResendEmailApiResponse | null;

      const retryAfterSeconds = normalizeRetryAfterSeconds(
        data?.retryAfterSeconds,
      );

      if (response.status === 429 && retryAfterSeconds > 0) {
        setCooldown(retryAfterSeconds);
        return;
      }

      if (!response.ok) {
        throw new Error(data?.code ?? "RESEND_EMAIL_FAILED");
      }

      if (data?.code === "EMAIL_ALREADY_VERIFIED") {
        setCooldown(0);
        return;
      }

      setCooldown(retryAfterSeconds || DEFAULT_RESEND_DELAY_SECONDS);

      setIsResent(data?.code === "VERIFICATION_TOKEN_REISSUED");
    } catch (error) {
      console.error("Resending verification email failed:", error);

      setHasResendError(true);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <VerifyEmailCard
      email={email}
      secondsLeft={secondsLeft}
      isStatusLoading={isStatusLoading}
      isResending={isResending}
      isResent={isResent}
      hasResendError={hasResendError}
      onResendAction={handleResend}
    />
  );
}
