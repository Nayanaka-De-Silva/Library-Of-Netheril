declare module "bun:sqlite" {
  export class Database {
    constructor(filename?: string, options?: { create?: boolean });
    exec(sql: string): void;
    prepare<T = unknown>(sql: string): {
      all(...params: unknown[]): T[];
      get(...params: unknown[]): T | undefined;
      run(...params: unknown[]): unknown;
    };
    transaction<T extends (...args: never[]) => unknown>(fn: T): T;
    close(): void;
  }
}
