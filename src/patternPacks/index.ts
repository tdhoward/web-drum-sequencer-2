import presets from '../presets';
import {
  DEFAULT_PATTERN_COUNT,
  type FactoryPreset,
  type FactoryPresetChannel,
  type PatternPack,
  type PatternPackLane,
} from '../common/sequencerModel';

const patternPackIdsByName: Record<string, string> = {
  Empty: 'empty',
  808: 'electro-808',
  'Ace Drum': 'ace-drum-grooves',
  LDrum: 'linndrum-grooves',
  'Hip Hop': 'hip-hop-swing',
  707: 'tr-707-grooves',
};

const patternPackNamesByName: Record<string, string> = {
  Empty: 'Empty',
  808: 'Electro 808',
  'Ace Drum': 'Ace Drum Grooves',
  LDrum: 'LinnDrum Grooves',
  'Hip Hop': 'Hip Hop Swing',
  707: 'TR-707 Grooves',
};

const slugify = (value: string): string => String(value)
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

const channelToLane = (channel: FactoryPresetChannel): PatternPackLane => ({
  id: channel.laneId || channel.id,
  laneId: channel.laneId || channel.id,
  name: channel.name || channel.id,
  percussionType: channel.percussionType,
  articulation: channel.articulation,
  register: channel.register,
  tags: channel.tags,
});

const getPresetPatternCount = (preset: FactoryPreset): number => Math.max(
  DEFAULT_PATTERN_COUNT,
  ...Object.values(preset.notes).map(channelPatterns => channelPatterns.length),
);

const createGenericPatternNames = (patternCount: number): string[] => (
  Array.from({ length: patternCount }, (_, index) => `Pattern ${index + 1}`)
);

const presetToPatternPack = (preset: FactoryPreset): PatternPack => ({
  id: patternPackIdsByName[preset.name] || slugify(preset.name),
  name: patternPackNamesByName[preset.name] || preset.name,
  bpm: preset.bpm,
  swing: preset.swing,
  patternNames: createGenericPatternNames(getPresetPatternCount(preset)),
  lanes: preset.channels.map(channelToLane),
  notes: preset.notes,
});

const patternPacks: PatternPack[] = presets.map(presetToPatternPack);

export default patternPacks;
