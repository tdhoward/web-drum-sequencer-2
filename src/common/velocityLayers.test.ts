import {
  DEFAULT_MIDI_VELOCITY,
  getReferenceVelocityLayer,
  getVelocityLayerForVelocity,
  getVelocityLayerRange,
  legacyVelocityToMidiVelocity,
  MAX_MIDI_VELOCITY,
  MIN_AUDIBLE_MIDI_VELOCITY,
  normalizeMidiVelocity,
  normalizeVelocityLayers,
  noteVelocityToGain,
  removeVelocityLayer,
  setVelocityLayerBoundary,
  SILENT_MIDI_VELOCITY,
  splitVelocityLayer,
  transformSampleAlignmentOffset,
  validateVelocityLayers,
} from './velocityLayers';
import type { VelocityLayer } from './velocityLayers';

const createThreeLayers = (): VelocityLayer[] => [
  {
    id: 'soft',
    sampleId: 'sample:soft',
    maxVelocity: 55,
    alignmentOffset: 0.01,
    trimDb: -3,
  },
  {
    id: 'medium',
    sampleId: 'sample:medium',
    maxVelocity: 100,
    alignmentOffset: 0.02,
    trimDb: 0,
  },
  {
    id: 'hard',
    sampleId: 'sample:hard',
    maxVelocity: 127,
    alignmentOffset: 0.03,
    trimDb: -1.5,
  },
];

const expectValidPartition = (layers: VelocityLayer[]): void => {
  expect(validateVelocityLayers(layers)).toEqual([]);
  expect(getVelocityLayerRange(layers, 0)?.minVelocity)
    .toBe(MIN_AUDIBLE_MIDI_VELOCITY);
  expect(layers[layers.length - 1].maxVelocity).toBe(MAX_MIDI_VELOCITY);
};

describe('MIDI velocity conversion', () => {
  test('normalizes velocities to integer MIDI bounds', () => {
    expect(normalizeMidiVelocity(-1)).toBe(SILENT_MIDI_VELOCITY);
    expect(normalizeMidiVelocity(32.4)).toBe(32);
    expect(normalizeMidiVelocity(32.5)).toBe(33);
    expect(normalizeMidiVelocity(200)).toBe(MAX_MIDI_VELOCITY);
    expect(normalizeMidiVelocity(Number.NaN)).toBe(DEFAULT_MIDI_VELOCITY);
  });

  test('preserves the exact gain anchors', () => {
    expect(noteVelocityToGain(0)).toBe(0);
    expect(noteVelocityToGain(32)).toBe(0.5);
    expect(noteVelocityToGain(64)).toBe(1);
    expect(noteVelocityToGain(127)).toBe(2);
  });

  test('converts legacy gain multipliers into MIDI velocities', () => {
    expect(legacyVelocityToMidiVelocity(0)).toBe(0);
    expect(legacyVelocityToMidiVelocity(0.5)).toBe(32);
    expect(legacyVelocityToMidiVelocity(1)).toBe(64);
    expect(legacyVelocityToMidiVelocity(1.25)).toBe(80);
    expect(legacyVelocityToMidiVelocity(2)).toBe(127);
    expect(legacyVelocityToMidiVelocity(Number.NaN)).toBe(64);
  });
});

describe('velocity layer normalization', () => {
  test('normalizes a legacy channel deterministically to one complete layer', () => {
    const channel = {
      id: 'snare',
      sample: 'snare.wav',
    };
    const firstNormalization = normalizeVelocityLayers(channel);
    const secondNormalization = normalizeVelocityLayers(channel);

    expect(firstNormalization).toEqual([{
      id: 'snare:layer:1',
      sampleId: 'sample:snare.wav',
      maxVelocity: 127,
      alignmentOffset: 0,
      trimDb: 0,
    }]);
    expect(secondNormalization).toEqual(firstNormalization);
    expectValidPartition(firstNormalization);
  });

  test('copies legacy sample alignment into a normalized legacy layer', () => {
    const layers = normalizeVelocityLayers({
      id: 'kick',
      sampleId: 'sample:kick',
    }, {
      entities: {
        'sample:kick': {
          alignmentOffset: 0.045,
        },
      },
    });

    expect(layers[0].alignmentOffset).toBe(0.045);
  });

  test('normalizes missing fields and malformed ranges into a valid partition', () => {
    const layers = normalizeVelocityLayers({
      id: 'snare',
      sampleId: 'sample:fallback',
      velocityLayers: [
        {
          id: 'duplicate',
          sampleId: 'sample:soft',
          maxVelocity: 120,
          alignmentOffset: -1,
          trimDb: Number.NaN,
        },
        {
          id: 'duplicate',
          sample: 'medium.wav',
          maxVelocity: 20,
        },
        {
          maxVelocity: 20,
        },
      ],
    });

    expect(layers).toEqual([
      {
        id: 'duplicate',
        sampleId: 'sample:soft',
        maxVelocity: 120,
        alignmentOffset: 0,
        trimDb: 0,
      },
      {
        id: 'duplicate:2',
        sampleId: 'sample:medium.wav',
        maxVelocity: 121,
        alignmentOffset: 0,
        trimDb: 0,
      },
      {
        id: 'snare:layer:3',
        sampleId: 'sample:fallback',
        maxVelocity: 127,
        alignmentOffset: 0,
        trimDb: 0,
      },
    ]);
    expectValidPartition(layers);
  });

  test('rejects a layer count that cannot fit into the MIDI velocity domain', () => {
    expect(() => normalizeVelocityLayers({
      id: 'oversized',
      sampleId: 'sample:one',
      velocityLayers: Array.from({ length: 128 }, () => ({
        sampleId: 'sample:one',
      })),
    })).toThrow(RangeError);
  });
});

describe('sample alignment transformation', () => {
  test('preserves the source alignment point after a leading trim', () => {
    expect(transformSampleAlignmentOffset(0.4, {
      trimStartSeconds: 0.25,
      renderedDuration: 0.5,
    })).toBeCloseTo(0.15);
  });

  test('clamps alignment before the trim and beyond the rendered duration', () => {
    expect(transformSampleAlignmentOffset(0.1, {
      trimStartSeconds: 0.25,
      renderedDuration: 0.5,
    })).toBe(0);
    expect(transformSampleAlignmentOffset(1.2, {
      trimStartSeconds: 0.25,
      renderedDuration: 0.5,
    })).toBe(0.5);
  });
});

describe('velocity layer lookup', () => {
  test('derives inclusive ranges from ordered upper boundaries', () => {
    const layers = createThreeLayers();

    expect(getVelocityLayerRange(layers, 0)).toEqual({
      minVelocity: 1,
      maxVelocity: 55,
    });
    expect(getVelocityLayerRange(layers, 1)).toEqual({
      minVelocity: 56,
      maxVelocity: 100,
    });
    expect(getVelocityLayerRange(layers, 2)).toEqual({
      minVelocity: 101,
      maxVelocity: 127,
    });
    expect(getVelocityLayerRange(layers, 3)).toBeUndefined();
  });

  test.each([
    [1, 'soft'],
    [55, 'soft'],
    [56, 'medium'],
    [64, 'medium'],
    [100, 'medium'],
    [101, 'hard'],
    [127, 'hard'],
  ])('selects velocity %i from the %s layer', (velocity, expectedLayerId) => {
    expect(getVelocityLayerForVelocity(createThreeLayers(), velocity)?.id)
      .toBe(expectedLayerId);
  });

  test('reserves zero for silence and rejects non-integer or out-of-range velocities', () => {
    const layers = createThreeLayers();

    expect(getVelocityLayerForVelocity(layers, 0)).toBeUndefined();
    expect(getVelocityLayerForVelocity(layers, 55.5)).toBeUndefined();
    expect(getVelocityLayerForVelocity(layers, 128)).toBeUndefined();
  });

  test('uses the layer containing velocity 64 as the reference layer', () => {
    expect(getReferenceVelocityLayer(createThreeLayers())?.id).toBe('medium');
  });
});

describe('velocity layer editing operations', () => {
  test.each([
    ['soft', [28, 55, 100, 127]],
    ['medium', [55, 78, 100, 127]],
    ['hard', [55, 100, 114, 127]],
  ])('splits the %s layer without changing its sound assignment', (layerId, boundaries) => {
    const original = createThreeLayers();
    const split = splitVelocityLayer(original, layerId);
    const splitIndex = split.findIndex(layer => layer.id === `${layerId}:split`);

    expect(split.map(layer => layer.maxVelocity)).toEqual(boundaries);
    expect(split[splitIndex]).toEqual(expect.objectContaining({
      sampleId: `sample:${layerId}`,
      alignmentOffset: original.find(layer => layer.id === layerId)?.alignmentOffset,
      trimDb: original.find(layer => layer.id === layerId)?.trimDb,
    }));
    expectValidPartition(split);
    expect(original).toEqual(createThreeLayers());
  });

  test('does not split a one-velocity range or an unknown layer', () => {
    const layers = createThreeLayers();
    const narrowLayers = setVelocityLayerBoundary(layers, 'soft', 1);

    expect(splitVelocityLayer(narrowLayers, 'soft')).toEqual(narrowLayers);
    expect(splitVelocityLayer(layers, 'missing')).toEqual(layers);
  });

  test.each([
    ['soft', ['medium', 'hard'], [100, 127]],
    ['medium', ['soft', 'hard'], [100, 127]],
    ['hard', ['soft', 'medium'], [55, 127]],
  ])('removes the %s layer by merging into an adjacent range', (
    layerId,
    expectedIds,
    expectedBoundaries,
  ) => {
    const removed = removeVelocityLayer(createThreeLayers(), layerId);

    expect(removed.map(layer => layer.id)).toEqual(expectedIds);
    expect(removed.map(layer => layer.maxVelocity)).toEqual(expectedBoundaries);
    expectValidPartition(removed);
  });

  test('does not remove the final layer', () => {
    const layers = normalizeVelocityLayers({
      id: 'kick',
      sampleId: 'sample:kick',
    });

    expect(removeVelocityLayer(layers, layers[0].id)).toEqual(layers);
    expectValidPartition(layers);
  });

  test('clamps boundary changes so both adjacent layers remain non-empty', () => {
    const layers = createThreeLayers();

    const lowBoundary = setVelocityLayerBoundary(layers, 'medium', -20);
    expect(lowBoundary.map(layer => layer.maxVelocity)).toEqual([55, 56, 127]);
    expectValidPartition(lowBoundary);

    const highBoundary = setVelocityLayerBoundary(layers, 'medium', 200);
    expect(highBoundary.map(layer => layer.maxVelocity)).toEqual([55, 126, 127]);
    expectValidPartition(highBoundary);
  });

  test('keeps the final boundary fixed and can change the reference layer', () => {
    const layers: VelocityLayer[] = [
      {
        id: 'soft',
        sampleId: 'sample:soft',
        maxVelocity: 63,
        alignmentOffset: 0,
        trimDb: 0,
      },
      {
        id: 'hard',
        sampleId: 'sample:hard',
        maxVelocity: 127,
        alignmentOffset: 0,
        trimDb: 0,
      },
    ];

    expect(getReferenceVelocityLayer(layers)?.id).toBe('hard');
    const changed = setVelocityLayerBoundary(layers, 'soft', 64);
    expect(getReferenceVelocityLayer(changed)?.id).toBe('soft');
    expect(setVelocityLayerBoundary(changed, 'hard', 100)).toEqual(changed);
    expectValidPartition(changed);
  });
});

describe('velocity layer validation', () => {
  test('reports empty, duplicate, descending, out-of-range, and missing-final inputs', () => {
    expect(validateVelocityLayers([])).toEqual([
      'velocityLayers must contain at least one layer',
    ]);

    const errors = validateVelocityLayers([
      {
        id: 'duplicate',
        sampleId: '',
        maxVelocity: 128,
        alignmentOffset: -1,
        trimDb: Number.NaN,
      },
      {
        id: 'duplicate',
        sampleId: 'sample:two',
        maxVelocity: 50,
        alignmentOffset: 0,
        trimDb: 0,
      },
    ]);

    expect(errors).toEqual(expect.arrayContaining([
      'velocityLayers[0].sampleId must be a non-empty string',
      'velocityLayers[0].maxVelocity must be an integer from 1 to 127',
      'velocityLayers[0].alignmentOffset must be a non-negative finite number',
      'velocityLayers[0].trimDb must be a finite number',
      'velocityLayers[1].id must be unique: duplicate',
      'velocityLayers[1].maxVelocity must be strictly increasing',
      'velocityLayers must end at 127',
    ]));
  });
});
