import { ValueTransformer } from "typeorm";

export const BigIntTransformer: ValueTransformer = {
  to: (entityValue: number) => entityValue,
  from: (databaseValue: string): number => Date.parse(databaseValue),
};

export const BigIntDateTransformer: ValueTransformer = {
  to: (entityValue: number) => new Date(entityValue),
  from: (databaseValue: string): number => Date.parse(databaseValue),
};
