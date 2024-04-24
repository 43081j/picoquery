import {type CONTINUE, type ArraySyntax} from './shared.js';
import {parse as fastParse} from 'fast-querystring';

export type ParsedQuery = Record<PropertyKey, unknown>;

export type DeserializeValueFunction = (
  key: string,
  value: string
) => unknown | typeof CONTINUE;

export type DeserializeKeyFunction = (
  key: string
) => PropertyKey | typeof CONTINUE;

export interface ParseOptions {
  // Enable parsing nested objects and arrays
  // default: true
  nested: boolean;

  // Array syntax
  // default: "index"
  arraySyntax: ArraySyntax;

  // Delimiter to split kv pairs by
  // default: "&"
  delimiter: string;

  // Custom deserializers
  valueDeserializer: DeserializeValueFunction;
  keyDeserializer: DeserializeKeyFunction;
}

export type UserParseOptions = Partial<ParseOptions>;

const defaultKeyDeserializer: DeserializeKeyFunction = (key) => {
  const asNumber = Number(key);
  if (!Number.isNaN(asNumber)) {
    return asNumber;
  }
  return key;
};

const defaultValueDeserializer: DeserializeValueFunction = (_key, value) => {
  const asNumber = Number(value);
  if (!Number.isNaN(asNumber)) {
    return asNumber;
  }
  return value;
};

const defaultOptions: ParseOptions = {
  nested: true,
  arraySyntax: 'repeat',
  delimiter: '&',
  valueDeserializer: defaultValueDeserializer,
  keyDeserializer: defaultKeyDeserializer
};

export function parse(
  input: string,
  options?: Partial<ParseOptions>
): ParsedQuery {
  const mergedOptions = {...defaultOptions, ...options};
  const getKey = mergedOptions.keyDeserializer;
  const getValue = mergedOptions.valueDeserializer;

  const parsed: Record<string, unknown> = fastParse(input);
  const result: ParsedQuery = {};

  for (const key in parsed) {
    if (Object.prototype.hasOwnProperty.call(parsed, key)) {
      const value = parsed[key];

      if (Array.isArray(value)) {
        result[getKey(key)] = value.map((v) => {
          if (typeof v === 'string') {
            return getValue('[]', v);
          }
          return v;
        });
      } else if (typeof value === 'string') {
        result[getKey(key)] = getValue(key, value);
      } else {
        result[getKey(key)] = value;
      }
    }
  }

  return result;
}
