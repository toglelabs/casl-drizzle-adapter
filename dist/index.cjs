'use strict';

require('drizzle-orm/pg-core');
var drizzleOrm = require('drizzle-orm');

// src/errors.ts
var UnknownColumnError = class extends Error {
  constructor(columnName) {
    super(`Unknown column: ${columnName}`);
    this.name = "UnknownColumnError";
  }
};
var UnsupportedOperatorError = class extends Error {
  constructor(operator) {
    super(`Unsupported operator: ${operator}`);
    this.name = "UnsupportedOperatorError";
  }
};
var $eq = (column, value) => {
  return drizzleOrm.eq(column, value);
};
var $in = (column, value) => {
  if (!Array.isArray(value)) {
    throw new Error("$in operator expects an array value");
  }
  return drizzleOrm.inArray(column, value);
};

// src/operators/index.ts
var defaultOperators = {
  $eq,
  $in
};
function mapRuleToSQL(opts) {
  const { rule, table, operators } = opts;
  const conditions = [];
  const validColumns = drizzleOrm.getTableColumns(table);
  for (const [field, value] of Object.entries(rule)) {
    const column = validColumns[field];
    if (!column) {
      throw new UnknownColumnError(field);
    }
    if (value !== null && typeof value === "object" && !Array.isArray(value) && Object.keys(value).some((k) => k.startsWith("$"))) {
      for (const [op, opValue] of Object.entries(value)) {
        if (!op.startsWith("$")) {
          throw new UnsupportedOperatorError(op);
        }
        const operatorFn = operators[op];
        if (!operatorFn) {
          throw new UnsupportedOperatorError(op);
        }
        conditions.push(operatorFn(column, opValue));
      }
    } else {
      const eqOp = operators["$eq"];
      if (!eqOp) {
        throw new UnsupportedOperatorError("$eq");
      }
      conditions.push(eqOp(column, value));
    }
  }
  if (conditions.length === 0) {
    return null;
  }
  return drizzleOrm.and(...conditions) || null;
}

// src/buildFilter.ts
function buildFilter(rules, table, operators) {
  const canRules = rules.filter((r) => !r.inverted && r.conditions);
  const cannotRules = rules.filter((r) => r.inverted && r.conditions);
  const allowFilters = canRules.map((r) => mapRuleToSQL({ rule: r.conditions, table, operators })).filter((f) => !!f);
  const denyFilters = cannotRules.map((r) => mapRuleToSQL({ rule: r.conditions, table, operators })).filter((f) => !!f);
  if (allowFilters.length === 0 && denyFilters.length === 0) {
    return null;
  }
  if (allowFilters.length === 0) {
    return drizzleOrm.sql`false`;
  }
  const allow = drizzleOrm.or(...allowFilters);
  if (denyFilters.length === 0) {
    return allow || null;
  }
  const deny = drizzleOrm.not(drizzleOrm.or(...denyFilters));
  return drizzleOrm.and(allow, deny) || null;
}

// src/createCaslDrizzleAdapter.ts
function createCaslDrizzleAdapter(opts) {
  const { table, operators: customOperators } = opts;
  const operators = {
    ...defaultOperators,
    ...customOperators
  };
  return {
    filterFromRules(rules) {
      return buildFilter(rules, table, operators);
    },
    filterFromAbility(ability, action, subject) {
      const rules = ability.rulesFor(action, subject);
      return buildFilter(rules, table, operators);
    }
  };
}

exports.UnknownColumnError = UnknownColumnError;
exports.UnsupportedOperatorError = UnsupportedOperatorError;
exports.createCaslDrizzleAdapter = createCaslDrizzleAdapter;
exports.defaultOperators = defaultOperators;
//# sourceMappingURL=index.cjs.map
//# sourceMappingURL=index.cjs.map