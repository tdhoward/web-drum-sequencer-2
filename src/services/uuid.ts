const fallbackUuid = (): string => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
  const random = Math.floor(Math.random() * 16);
  const value = char === 'x' ? random : (random & 0x3) | 0x8;
  return value.toString(16);
});

const getCrypto = (): Crypto | undefined => {
  if (typeof window !== 'undefined' && window.crypto) {
    return window.crypto;
  }

  return undefined;
};

export const uuid = (): string => {
  const crypto = getCrypto();

  if (crypto && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return fallbackUuid();
};
