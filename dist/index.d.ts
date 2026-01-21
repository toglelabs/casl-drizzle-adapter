import { AnyColumn, SQL } from 'drizzle-orm';
import { SubjectType, MongoQuery, Ability, AbilityTuple } from '@casl/ability';
import { PgTable } from 'drizzle-orm/pg-core';

type OperatorFn = (column: AnyColumn, value: unknown) => SQL;
type OperatorMap = {
    $eq?: OperatorFn;
    $in?: OperatorFn;
    $ne?: OperatorFn;
    $gt?: OperatorFn;
    $gte?: OperatorFn;
    $lt?: OperatorFn;
    $lte?: OperatorFn;
    [key: string]: OperatorFn | undefined;
};
interface AccessRule {
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
type CaslDrizzleAdapter = {
    filterFromRules(rules: AccessRule[]): SQL | null;
    filterFromAbility(ability: Ability<AbilityTuple, MongoQuery>, action: string, subject: SubjectType): SQL | null;
};

declare class UnknownColumnError extends Error {
    constructor(columnName: string);
}
declare class UnsupportedOperatorError extends Error {
    constructor(operator: string);
}

declare function createCaslDrizzleAdapter(opts: {
    table: PgTable;
    operators?: OperatorMap;
}): CaslDrizzleAdapter;

declare const defaultOperators: OperatorMap;

export { type AccessRule, type CaslDrizzleAdapter, type OperatorFn, type OperatorMap, UnknownColumnError, UnsupportedOperatorError, createCaslDrizzleAdapter, defaultOperators };
