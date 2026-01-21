import { type AnyColumn, eq, inArray } from "drizzle-orm";
import type { OperatorFn } from "../types";

export const $eq: OperatorFn = (column: AnyColumn, value: unknown) => {
  return eq(column, value);
};

export const $in: OperatorFn = (column: AnyColumn, value: unknown) => {
  if (!Array.isArray(value)) {
    throw new Error("$in operator expects an array value");
  }
  return inArray(column, value);
};
