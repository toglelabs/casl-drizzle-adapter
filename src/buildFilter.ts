import { and, not, or, type SQL, sql } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import { mapRuleToSQL } from "./mapRuleToSQL";
import type { AccessRule, OperatorMap } from "./types";

export function buildFilter(
  rules: AccessRule[],
  table: PgTable,
  operators: OperatorMap,
): SQL | null {
  const canRules = rules.filter((r) => !r.inverted && r.conditions);
  const cannotRules = rules.filter((r) => r.inverted && r.conditions);

  const allowFilters = canRules
    .map((r) => {
      if (!r.conditions) return null;
      return mapRuleToSQL({ rule: r.conditions, table, operators });
    })
    .filter((f): f is SQL => !!f);

  const denyFilters = cannotRules
    .map((r) => {
      if (!r.conditions) return null;
      return mapRuleToSQL({ rule: r.conditions, table, operators });
    })
    .filter((f): f is SQL => !!f);

  if (allowFilters.length === 0 && denyFilters.length === 0) {
    return null;
  }

  if (allowFilters.length === 0) {
    return sql`false`;
  }

  const allow = or(...allowFilters) as SQL;

  if (denyFilters.length === 0) {
    return allow || null; // 'allow' could be undefined if array was empty but we handled that check above?
    // Wait, allowFilters.length > 0 means or(...) returns SOMETHING.
    // drizzle's 'or' with 1 arg returns that arg.
    // 'or' with >1 args returns SQL.
    // 'or' with 0 args is undefined? But we checked length === 0.
    // So 'allow' is SQL.
  }

  const deny = not(or(...denyFilters) as SQL);

  return and(allow, deny) || null;
}
