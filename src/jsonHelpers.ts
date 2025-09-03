import type { Configs } from "./proto";

export const parseConfigsFromJSON = (input: string): Configs => {
  const json = JSON.parse(input);
  return json as Configs;
};

export const parseConfigsFromObject = (json: any): Configs => {
  return json as Configs;
};
