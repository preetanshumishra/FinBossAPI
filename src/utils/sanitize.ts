const PROHIBITED_KEY_CHARS = /[\$\.]/g;

function sanitizeValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value !== null && typeof value === 'object') {
    return sanitizeObject(value as Record<string, unknown>);
  }
  // String and primitive values are left as-is — injection is via keys, not values
  return value;
}

function sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    const sanitizedKey = key.replace(PROHIBITED_KEY_CHARS, '_');
    result[sanitizedKey] = sanitizeValue(obj[key]);
  }
  return result;
}

export function sanitize<T>(target: T): T {
  if (target === null || target === undefined) return target;
  if (typeof target !== 'object') return target;
  return sanitizeObject(target as Record<string, unknown>) as T;
}
