export class ScaffoldError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'ScaffoldError';
  }
}

export const isNodeError = (e: unknown): e is NodeJS.ErrnoException =>
  e instanceof Error && 'code' in e;
