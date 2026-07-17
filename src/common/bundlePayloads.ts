const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export const bytesToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let result = '';
  for (let index = 0; index < bytes.length; index += 3) {
    const first = bytes[index];
    const second = bytes[index + 1];
    const third = bytes[index + 2];
    const value = (first << 16) | ((second || 0) << 8) | (third || 0);
    result += BASE64_ALPHABET[(value >> 18) & 63];
    result += BASE64_ALPHABET[(value >> 12) & 63];
    result += index + 1 < bytes.length ? BASE64_ALPHABET[(value >> 6) & 63] : '=';
    result += index + 2 < bytes.length ? BASE64_ALPHABET[value & 63] : '=';
  }
  return result;
};

export const base64ToBytes = (value: string, errorMessage: string): ArrayBuffer => {
  if (value.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(value)) {
    throw new Error(errorMessage);
  }
  const padding = value.endsWith('==') ? 2 : value.endsWith('=') ? 1 : 0;
  const bytes = new Uint8Array((value.length / 4) * 3 - padding);
  let outputIndex = 0;
  for (let index = 0; index < value.length; index += 4) {
    const first = BASE64_ALPHABET.indexOf(value[index]);
    const second = BASE64_ALPHABET.indexOf(value[index + 1]);
    const third = value[index + 2] === '=' ? 0 : BASE64_ALPHABET.indexOf(value[index + 2]);
    const fourth = value[index + 3] === '=' ? 0 : BASE64_ALPHABET.indexOf(value[index + 3]);
    const combined = (first << 18) | (second << 12) | (third << 6) | fourth;
    if (outputIndex < bytes.length) bytes[outputIndex++] = (combined >> 16) & 255;
    if (outputIndex < bytes.length) bytes[outputIndex++] = (combined >> 8) & 255;
    if (outputIndex < bytes.length) bytes[outputIndex++] = combined & 255;
  }
  return bytes.buffer;
};

export const serializeBinaryPayloads = (
  payloads: Record<string, ArrayBuffer>,
): Record<string, string> => Object.entries(payloads).reduce<Record<string, string>>(
  (serialized, [key, buffer]) => {
    serialized[key] = bytesToBase64(buffer);
    return serialized;
  },
  {},
);

export const parseBinaryPayloads = (
  value: Record<string, unknown>,
  errorMessage: string,
): Record<string, ArrayBuffer> => Object.entries(value).reduce<Record<string, ArrayBuffer>>(
  (payloads, [key, encoded]) => {
    if (typeof encoded !== 'string') throw new Error(errorMessage);
    payloads[key] = base64ToBytes(encoded, errorMessage);
    return payloads;
  },
  {},
);
