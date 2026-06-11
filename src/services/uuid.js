const fallbackUuid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
  const random = Math.floor(Math.random() * 16);
  const value = char === 'x' ? random : (random & 0x3) | 0x8;
  return value.toString(16);
});

export const uuid = () => {
  if (
    typeof globalThis !== 'undefined'
    && globalThis.crypto
    && typeof globalThis.crypto.randomUUID === 'function'
  ) {
    return globalThis.crypto.randomUUID();
  }

  return fallbackUuid();
};