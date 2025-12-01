export function isMongoDuplicateError(error: unknown): error is { code: number } {
  return typeof error === "object" && error !== null && "code" in error && typeof (error as { code: unknown }).code === "number";
}
