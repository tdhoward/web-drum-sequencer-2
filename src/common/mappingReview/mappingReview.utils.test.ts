import {
  createInitialMappingReviewSelections,
  createReviewedMappings,
  needsMappingReview,
  updateMappingReviewSelection,
} from './mappingReview.utils';
import type { KitChannelMappingResult, TargetKitChannel } from '../percussion';

const source = {
  id: 'rim-lane',
  laneId: 'rim-lane',
  name: 'Rimshot',
  percussionType: 'rimshot',
};

const snareTarget: TargetKitChannel = {
  id: 'snare-channel',
  name: 'Snare',
  percussionType: 'snare_drum',
};

const clapTarget: TargetKitChannel = {
  id: 'clap-channel',
  name: 'Clap',
  percussionType: 'clap',
};

const lowConfidenceResult: KitChannelMappingResult = {
  mappings: [{
    laneId: source.laneId,
    source,
    targetKitChannelId: snareTarget.id,
    target: snareTarget,
    confidence: 'low',
    reason: 'compatible percussionType fallback from rimshot to snare_drum',
  }],
  unresolved: [{
    laneId: 'cymbal-lane',
    source: {
      id: 'cymbal-lane',
      laneId: 'cymbal-lane',
      name: 'Cymbal',
      percussionType: 'cymbal',
    },
    reason: 'no target kit channel matched this lane',
  }],
};

describe('mapping review utilities', () => {
  test('only requires review for low-confidence or unresolved mappings', () => {
    expect(needsMappingReview({
      mappings: [{
        ...lowConfidenceResult.mappings[0],
        confidence: 'medium',
      }],
      unresolved: [],
    })).toBe(false);
    expect(needsMappingReview(lowConfidenceResult)).toBe(true);
  });

  test('starts with the fallback selected and unresolved lanes silent', () => {
    expect(createInitialMappingReviewSelections(lowConfidenceResult)).toEqual({
      'rim-lane': 'snare-channel',
      'cymbal-lane': null,
    });
  });

  test('creates manual assignments and omits lanes left silent', () => {
    const mappings = createReviewedMappings(
      lowConfidenceResult,
      [snareTarget, clapTarget],
      {
        'rim-lane': 'clap-channel',
        'cymbal-lane': null,
      },
    );

    expect(mappings).toEqual([expect.objectContaining({
      laneId: 'rim-lane',
      targetKitChannelId: 'clap-channel',
      confidence: 'manual',
      reason: 'selected manually during mapping review',
    })]);
  });

  test('swaps a claimed target to keep assignments one-to-one', () => {
    expect(updateMappingReviewSelection({
      kick: 'kick-channel',
      snare: 'snare-channel',
    }, 'kick', 'snare-channel')).toEqual({
      kick: 'snare-channel',
      snare: 'kick-channel',
    });
  });
});
