import { and, getTableColumns, type SQL, sql } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import { UnknownColumnError, UnsupportedOperatorError } from "./errors";
import type { OperatorMap } from "./types";

export function mapRuleToSQL(opts: {
  rule: Record<string, unknown>;
  table: PgTable;
  operators: OperatorMap;
}): SQL | null {
  const { rule, table, operators } = opts;
  const conditions: SQL[] = [];
  const validColumns = getTableColumns(table);

  // Iterate fields, not rules
  // Rule shape: { field: value } or { field: { $op: value } }
  for (const [field, value] of Object.entries(rule)) {
    // Unknown column check
    // Note: drizzle's getTableColumns returns a map where keys are property names in the table object
    // Assuming field names in CASL rule match property names in Drizzle table definition
    const column = validColumns[field];
    if (!column) {
      throw new UnknownColumnError(field);
    }

    // Check value shape
    if (
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      Object.keys(value).some((k) => k.startsWith("$"))
    ) {
      // It's an operator object e.g. { $in: [...] }
      for (const [op, opValue] of Object.entries(value)) {
        if (!op.startsWith("$")) {
          // Mixed operator and direct value is not valid in standard CASL v1 flat structure usually
          // But we only care about operators here.
          // "Field-level rules" are disallowed by spec, but { field: { nested: val } } is usually relation.
          // Spec says "Unknown operators" -> throw.
          // If key doesn't start with $, it might be treated as a nested field which is unsupported.
          // However, spec says "Flat conditions", "Nested $and, $or -> throw".
          // If we encounter a key that is not an operator in this position, it's ambiguous.
          // Given "Fail closed", let's treat any object key under a field that we are processing as an operator.
          // If it's not in the map, throw.
          throw new UnsupportedOperatorError(op);
        }

        const operatorFn = operators[op];
        if (!operatorFn) {
          throw new UnsupportedOperatorError(op);
        }
        conditions.push(operatorFn(column, opValue));
      }
    } else {
      // Direct equality: { field: value }
      const eqOp = operators.$eq;
      // $eq is always present as per spec, but good to be safe/consistent
      if (!eqOp) {
        // Should technically not happen if defaults are used but strictness check
        throw new UnsupportedOperatorError("$eq");
      }
      conditions.push(eqOp(column, value));
    }
  }

  if (conditions.length === 0) {
    return null;
  }

  // Multiple fields -> and(...)
  return and(...conditions) || null;
}
