import {
  addDraftVelocityLayer,
  applySavedSampleToDraft,
  getInitialVelocityLayerId,
  getLayerWorkspaceAriaLabel,
  getVelocityLayerPresentation,
  isValidVelocityLayerDraft,
  removeDraftVelocityLayer,
  setDraftLayerMaxVelocity,
  setDraftLayerMinVelocity,
  setDraftLayerAlignment,
  setDraftLayerSample,
  setDraftLayerTrim,
} from './SampleEditorModal.draft';
import type { VelocityLayer } from '../../common';

const createLayer = (
  id: string,
  maxVelocity: number,
  sampleId = 'sample:snare.wav',
): VelocityLayer => ({
  id,
  sampleId,
  maxVelocity,
  alignmentOffset: 0,
  trimDb: 0,
});

describe('Sample Editor velocity-layer draft', () => {
  test('opens on the layer containing velocity 64', () => {
    const layers = [
      createLayer('soft', 55),
      createLayer('medium', 100),
      createLayer('hard', 127),
    ];

    expect(getInitialVelocityLayerId(layers)).toBe('medium');
    expect(getInitialVelocityLayerId(layers, 'hard')).toBe('hard');
  });

  test('splits the selected layer without changing its sound and selects the new half', () => {
    const layers = [createLayer('main', 127)];
    const transition = addDraftVelocityLayer(layers, 'main');

    expect(transition.selectedLayerId).toBe('main:split');
    expect(transition.layers).toEqual([
      createLayer('main', 64),
      createLayer('main:split', 127),
    ]);
    expect(isValidVelocityLayerDraft(transition.layers)).toBe(true);
  });

  test('removes a middle layer while preserving a complete partition', () => {
    const layers = [
      createLayer('soft', 31),
      createLayer('medium', 95, 'sample:medium.wav'),
      createLayer('hard', 127, 'sample:hard.wav'),
    ];
    const transition = removeDraftVelocityLayer(layers, 'medium');

    expect(transition.selectedLayerId).toBe('soft');
    expect(transition.layers.map(layer => layer.maxVelocity)).toEqual([95, 127]);
    expect(isValidVelocityLayerDraft(transition.layers)).toBe(true);
  });

  test('clamps shared boundaries at 1 and 127 without gaps or overlaps', () => {
    const layers = [
      createLayer('soft', 40),
      createLayer('medium', 90),
      createLayer('hard', 127),
    ];

    const minimumClamped = setDraftLayerMinVelocity(layers, 'medium', 1);
    const maximumClamped = setDraftLayerMaxVelocity(minimumClamped, 'medium', 127);

    expect(minimumClamped.map(layer => layer.maxVelocity)).toEqual([1, 90, 127]);
    expect(maximumClamped.map(layer => layer.maxVelocity)).toEqual([1, 126, 127]);
    expect(isValidVelocityLayerDraft(maximumClamped)).toBe(true);
  });

  test('updates only the selected layer sample and trim', () => {
    const layers = [
      createLayer('soft', 63),
      createLayer('hard', 127, 'sample:hard.wav'),
    ];
    const withSample = setDraftLayerSample(layers, 'soft', 'sample:ghost.wav');
    const withTrim = setDraftLayerTrim(withSample, 'soft', -3);

    expect(withTrim[0]).toEqual(expect.objectContaining({
      sampleId: 'sample:ghost.wav',
      trimDb: -3,
    }));
    expect(withTrim[1]).toEqual(layers[1]);
  });

  test('keeps alignment in the local draft until apply', () => {
    const layers = [
      createLayer('soft', 63),
      createLayer('hard', 127, 'sample:hard.wav'),
    ];

    const updated = setDraftLayerAlignment(layers, 'hard', 0.126);

    expect(updated[0]).toEqual(layers[0]);
    expect(updated[1].alignmentOffset).toBe(0.126);
  });

  test('attaches a saved copy only to the selected layer and transforms its alignment', () => {
    const layers = [
      { ...createLayer('soft', 63), alignmentOffset: 0.1 },
      { ...createLayer('hard', 127, 'sample:hard.wav'), alignmentOffset: 0.4 },
    ];

    const updated = applySavedSampleToDraft({
      layers,
      selectedLayerId: 'hard',
      savedSampleId: 'sample:hard-copy.wav',
      alignmentTransform: {
        trimStartSeconds: 0.25,
        renderedDuration: 0.5,
      },
    });

    expect(updated[0]).toEqual(layers[0]);
    expect(updated[1].sampleId).toBe('sample:hard-copy.wav');
    expect(updated[1].alignmentOffset).toBeCloseTo(0.15);
  });

  test('transforms every draft reference when replacing a shared sample', () => {
    const layers = [
      { ...createLayer('soft', 63, 'sample:shared.wav'), alignmentOffset: 0.1 },
      { ...createLayer('hard', 127, 'sample:shared.wav'), alignmentOffset: 0.7 },
    ];

    const updated = applySavedSampleToDraft({
      layers,
      selectedLayerId: 'hard',
      savedSampleId: 'sample:shared.wav',
      replacedSampleId: 'sample:shared.wav',
      alignmentTransform: {
        trimStartSeconds: 0.25,
        renderedDuration: 0.4,
      },
    });

    expect(updated.map(layer => layer.alignmentOffset)).toEqual([0, 0.4]);
  });

  test('derives the visible three-layer summary and waveform label', () => {
    const layers = [
      createLayer('soft', 55),
      createLayer('medium', 100),
      createLayer('hard', 127),
    ];
    const presentation = getVelocityLayerPresentation(layers, 'medium');

    expect(presentation).toEqual({
      index: 1,
      label: 'Medium',
      minVelocity: 56,
      maxVelocity: 100,
      rangeLabel: '56-100',
    });
    expect(getLayerWorkspaceAriaLabel('Medium', '56-100')).toBe(
      'Edit Medium 56-100 sample waveform',
    );
  });
});
