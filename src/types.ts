import type {
  Ability,
  AbilityTuple,
  MongoQuery,
  SubjectType,
} from "@casl/ability";
import type { AnyColumn, SQL } from "drizzle-orm";

export type OperatorFn = (column: AnyColumn, value: unknown) => SQL;

export type OperatorMap = {
  $eq?: OperatorFn;
  $in?: OperatorFn;
  $ne?: OperatorFn;
  $gt?: OperatorFn;
  $gte?: OperatorFn;
  $lt?: OperatorFn;
  $lte?: OperatorFn;
  [key: string]: OperatorFn | undefined;
};

// AccessRule from @casl/ability equivalent for our needs
// We assume rules are coming from MongoAbility or PureAbility which have these fields
export interface AccessRule {
  action: string | string[];
  subject: SubjectType | SubjectType[];
  /**
   * @deprecated use "conditions" instead.
   */
  fields?: string[];
  conditions?: MongoQuery;
  inverted?: boolean;
  reason?: string;
  [key: string]: unknown;
}

export type CaslDrizzleAdapter = {
  filterFromRules(rules: AccessRule[]): SQL | null;
  filterFromAbility(
    ability: Ability<AbilityTuple, MongoQuery>,
    action: string,
    subject: SubjectType,
  ): SQL | null;
};
