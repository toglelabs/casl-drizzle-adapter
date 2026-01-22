import { and, not, or, type SQL, sql } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import { mapRuleToSQL } from "./mapRuleToSQL";
import type { AccessRule, OperatorMap } from "./types";

export function buildFilter(
  rules: AccessRule[],
  table: PgTable,
  operators: OperatorMap,
): SQL | null {
  const canRules = rules.filter((r) => !r.inverted);
  const cannotRules = rules.filter((r) => r.inverted);

  const allowResults = canRules.map((r) => {
    if (!r.conditions) return null; // No conditions = allow all
    return mapRuleToSQL({ rule: r.conditions, table, operators });
  });

  const denyFilters = cannotRules
    .map((r) => {
      if (!r.conditions) return null;
      return mapRuleToSQL({ rule: r.conditions, table, operators });
    })
    .filter((f): f is SQL => !!f);

  // If any allow rule has no conditions, allow all
  const hasAllowAll = allowResults.some((r) => r === null);
  const allowFilters = allowResults.filter((f): f is SQL => !!f);

  if (hasAllowAll) {
    // Allow all, but may have denies
    if (denyFilters.length === 0) {
      return null; // No WHERE clause = allow all
    }
    // Allow all AND NOT denies
    const deny = not(or(...denyFilters) as SQL);
    return deny; // WHERE NOT (deny conditions)
  }

  if (allowFilters.length === 0 && denyFilters.length === 0) {
    return sql`null`; // No permissions = deny all access
  }

  if (allowFilters.length === 0) {
    return sql`null`; // Only cannot rules = deny all
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
