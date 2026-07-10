const isRecord = (value: unknown): value is Record<string, unknown> => (
  Boolean(value && typeof value === 'object' && !Array.isArray(value))
);

export const deepEqual = (left: unknown, right: unknown): boolean => {
  if (Object.is(left, right)) {
    return true;
  }

  if (Array.isArray(left) || Array.isArray(right)) {
    if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) {
      return false;
    }

    return left.every((item, index) => deepEqual(item, right[index]));
  }

  if (isRecord(left) || isRecord(right)) {
    if (!isRecord(left) || !isRecord(right)) {
      return false;
    }

    const leftKeys = Object.keys(left);
    const rightKeys = Object.keys(right);
    if (leftKeys.length !== rightKeys.length) {
      return false;
    }

    return leftKeys.every(key => (
      Object.prototype.hasOwnProperty.call(right, key)
        && deepEqual(left[key], right[key])
    ));
  }

  return false;
};

export const omitFields = <TValue extends object>(
  value: TValue | undefined,
  fields: Set<string>,
): Record<string, unknown> | undefined => {
  if (!value) {
    return undefined;
  }

  return Object.entries(value).reduce<Record<string, unknown>>((result, [key, fieldValue]) => {
    if (!fields.has(key)) {
      result[key] = fieldValue;
    }
    return result;
  }, {});
};
