import { DEFAULT_KIT_ID } from '../sequencerModel';

const DEFAULT_KIT_PRESET_NAME = '808';

const slugify = (value: string): string => String(value)
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

export const kitIdFromPresetName = (name: string): string => (
  name === DEFAULT_KIT_PRESET_NAME
    ? DEFAULT_KIT_ID
    : `kit-${slugify(name) || 'untitled'}`
);
