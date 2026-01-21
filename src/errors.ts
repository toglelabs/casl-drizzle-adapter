export class UnknownColumnError extends Error {
  constructor(columnName: string) {
    super(`Unknown column: ${columnName}`);
    this.name = "UnknownColumnError";
  }
}

export class UnsupportedOperatorError extends Error {
  constructor(operator: string) {
    super(`Unsupported operator: ${operator}`);
    this.name = "UnsupportedOperatorError";
  }
}
