import type {
  Ability,
  AbilityTuple,
  MongoQuery,
  SubjectType,
} from "@casl/ability";
import type { SQL } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import { buildFilter } from "./buildFilter";
import { defaultOperators } from "./operators";
import type { AccessRule, CaslDrizzleAdapter, OperatorMap } from "./types";

export function createCaslDrizzleAdapter(opts: {
  table: PgTable;
  operators?: OperatorMap;
}): CaslDrizzleAdapter {
  const { table, operators: customOperators } = opts;

  // Custom operators EXTEND defaults, they do NOT replace them.
  const operators: OperatorMap = {
    ...defaultOperators,
    ...customOperators,
  };

  return {
    filterFromRules(rules: AccessRule[]): SQL | null {
      return buildFilter(rules, table, operators);
    },

    filterFromAbility(
      ability: Ability<AbilityTuple, MongoQuery>,
      action: string,
      subject: SubjectType,
    ): SQL | null {
      const rules = ability.rulesFor(action, subject);
      // AccessRule loosely matches CASL Rule, but we cast to satisfy strict TS
      // and explicitly handle the undefined fields potential mismatch if strict null checks are on.
      return buildFilter(rules as unknown as AccessRule[], table, operators);
    },
  };
}
