// Simple Generator interface - keep it minimal and practical

export interface Generator<T = any> {
  generate(): Promise<T>;
}

// Common generator error for consistency
export class GeneratorError extends Error {
  constructor(
    public readonly generatorName: string,
    message: string,
    public readonly cause?: Error
  ) {
    super(`[${generatorName}] ${message}`);
    this.name = 'GeneratorError';
  }
}