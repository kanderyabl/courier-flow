export type VerifyEmailCardProps = {
  email?: string;

  secondsLeft: number;
  isStatusLoading: boolean;
  isResending: boolean;
  isResent: boolean;
  hasResendError: boolean;

  onResendAction: () => Promise<void>;
};

export type VerifyEmailResult = "success" | "expired" | "invalid" | "error";

export type VerifyEmailViewStatus = "loading" | VerifyEmailResult;

export type VerifyEmailResultCardProps = {
  token: string;

  onVerifyAction?: (
    token: string,
    signal: AbortSignal,
  ) => Promise<VerifyEmailResult>;
};

export type VerifyEmailCardContainerProps = {
  email?: string;
  token?: string;
};

export type ResendEmailApiResponse = {
  code?: string;
  retryAfterSeconds?: number;
};
