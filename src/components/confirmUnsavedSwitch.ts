export type UnsavedContent = 'kit' | 'pattern pack' | 'song';

const formatContentList = (content: UnsavedContent[]): string => {
  if (content.length < 2) return content[0] || '';
  if (content.length === 2) return content.join(' and ');
  return `${content.slice(0, -1).join(', ')}, and ${content[content.length - 1]}`;
};

export const confirmUnsavedSwitch = (
  content: UnsavedContent[],
  confirmDiscard: (message: string) => boolean = message => window.confirm(message),
): boolean => {
  if (content.length === 0) return true;

  return confirmDiscard(
    `You have unsaved changes to the current ${formatContentList(content)}. `
    + 'Switching away will discard those changes. Continue?',
  );
};
