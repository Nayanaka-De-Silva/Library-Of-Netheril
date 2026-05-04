export type ApiErrorDetail = {
  field: string;
  message: string;
};

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: ApiErrorDetail[],
  ) {
    super(message);
  }
}

export const validationError = (message: string, details?: ApiErrorDetail[]) =>
  new ApiError(400, "VALIDATION_ERROR", message, details);
