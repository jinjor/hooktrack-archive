export interface Decoder<T> {
  run(value: unknown): T;
}

export class DecodeError extends Error {}

export const any: Decoder<any> = {
  run(value: unknown) {
    return value;
  }
};

export const boolean: Decoder<boolean> = {
  run(value: unknown) {
    if (typeof value !== "boolean") {
      throw new DecodeError(value + " is not a boolean!");
    }
    return value;
  }
};

export const number: Decoder<number> = {
  run(value: unknown) {
    if (typeof value !== "number") {
      throw new DecodeError(value + " is not a nubmer!");
    }
    return value;
  }
};

export const string: Decoder<string> = {
  run(value: unknown) {
    if (typeof value !== "string") {
      throw new DecodeError(value + " is not a string!");
    }
    return value;
  }
};

export function optional<T>(d: Decoder<T>, alternative?: T): Decoder<T> {
  return {
    run(value: unknown) {
      if (value === null || value === undefined) {
        return alternative || value;
      }
      return d.run(value);
    }
  };
}

export function array<T>(d: Decoder<T>): Decoder<T[]> {
  return {
    run(value: unknown) {
      if (!Array.isArray(value)) {
        throw new DecodeError(value + " is not an array!");
      }
      return value.map(d.run.bind(d));
    }
  };
}

export function object<T>(d: { [K in keyof T]: Decoder<T[K]> }): Decoder<T> {
  return {
    run(value: unknown): T {
      if (typeof value !== "object" || value === null || Array.isArray(value)) {
        throw new DecodeError(value + " is not an object!");
      }
      const ret: any = {};
      for (const key in d) {
        ret[key] = d[key].run((value as any)[key]);
      }
      return ret;
    }
  };
}

export function dict<V>(d: Decoder<V>): Decoder<{ [key: string]: V }> {
  return {
    run(value: unknown): { [key: string]: V } {
      if (typeof value !== "object" || value === null || Array.isArray(value)) {
        throw new DecodeError(value + " is not an object!");
      }
      const ret: { [key: string]: V } = {};
      for (const key in value) {
        ret[key] = d.run((value as any)[key]);
      }
      return ret;
    }
  };
}

export function oneOf<T>(d: Decoder<T>[]): Decoder<T> {
  return {
    run(value: unknown): T {
      for (const decoder of d) {
        try {
          return decoder.run(value);
        } catch (e) {}
      }
      throw new DecodeError(
        value + " cannot be decoded by any of " + d.length + " decoders!"
      );
    }
  };
}

export function keywords<T, V extends T>(keywords: V[]): Decoder<T> {
  return {
    run(value: unknown): T {
      for (const keyword of keywords) {
        if (keyword === value) {
          return keyword;
        }
      }
      throw new DecodeError(value + " should be one of " + keywords);
    }
  };
}

export function map<T, U>(f: (t: T) => U, d: Decoder<T>): Decoder<U> {
  return {
    run(value: unknown): U {
      return f(d.run(value));
    }
  };
}
