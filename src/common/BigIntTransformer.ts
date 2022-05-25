import { ValueTransformer } from "typeorm";

export const BigIntTransformer: ValueTransformer = {
  to: (entityValue: number) => entityValue,
  from: (databaseValue: string): number => Date.parse(databaseValue),
};
