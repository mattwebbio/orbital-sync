function isObject(item: unknown): item is Record<string, unknown> {
  return !!item && typeof item === 'object' && !Array.isArray(item);
}

export function deepMerge(target: unknown, ...sources: unknown[]): unknown {
  if (!sources?.length) return target;
  const source = sources.shift();
  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      const sk = source[key];
      if (isObject(sk)) {
        let tk = target[key];
        if (!tk) tk = target[key] = {};
        deepMerge(tk, sk);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }
  return deepMerge(target, ...sources);
}
