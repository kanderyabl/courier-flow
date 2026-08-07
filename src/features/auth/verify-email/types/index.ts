export type VerifyEmailCardVariant =
  | "pending"
  | "expired"
  | "success"
  | "invalid";

export type VerifyEmailCardProps = {
  variant?: VerifyEmailCardVariant;
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
  variant?: VerifyEmailCardVariant;
  email?: string;
  token?: string;
};

export type ResendEmailApiResponse = {
  code?: string;
  retryAfterSeconds?: number;
};
