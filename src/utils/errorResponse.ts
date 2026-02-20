export const getErrorMessage = (error: unknown, fallbackMessage: string): string => {
  if (process.env.NODE_ENV === 'production') {
    return fallbackMessage;
  }
  return error instanceof Error ? error.message : fallbackMessage;
};
