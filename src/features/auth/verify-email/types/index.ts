export type VerifyEmailCardProps = {
  email?: string;
  onResendAction?: () => void | Promise<void>;
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
