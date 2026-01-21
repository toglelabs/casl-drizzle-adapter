import type { OperatorMap } from "../types";
import { $eq, $in } from "./defaultOperators";

export const defaultOperators: OperatorMap = {
  $eq,
  $in,
};
