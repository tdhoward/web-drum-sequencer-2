import {
  getReferenceVelocityLayer,
  getVelocityLayerRange,
  removeVelocityLayer,
  setVelocityLayerBoundary,
  splitVelocityLayer,
  transformSampleAlignmentOffset,
  validateVelocityLayers,
  type SampleAlignmentTransform,
  type VelocityLayer,
  type VelocityLayerRange,
} from '../../common';

export const MAX_EDITOR_VELOCITY_LAYERS = 8;
export const MIN_LAYER_TRIM_DB = -24;
export const MAX_LAYER_TRIM_DB = 12;

export type VelocityLayerDraftTransition = {
  layers: VelocityLayer[];
  selectedLayerId: string;
};

export type VelocityLayerPresentation = VelocityLayerRange & {
  index: number;
  label: string;
  rangeLabel: string;
};

const cloneLayers = (layers: readonly VelocityLayer[]): VelocityLayer[] => (
  layers.map(layer => ({ ...layer }))
);

const clamp = (value: number, min: number, max: number): number => (
  Math.min(max, Math.max(min, value))
);

export const getVelocityLayerLabel = (layerCount: number, index: number): string => {
  if (layerCount === 1) {
    return 'Main';
  }
  if (layerCount === 2) {
    return index === 0 ? 'Soft' : 'Hard';
  }
  if (layerCount === 3) {
    return ['Soft', 'Medium', 'Hard'][index] || `Layer ${index + 1}`;
  }
  return `Layer ${index + 1}`;
};

export const getVelocityLayerPresentation = (
  layers: readonly VelocityLayer[],
  layerId: string,
): VelocityLayerPresentation | undefined => {
  const index = layers.findIndex(layer => layer.id === layerId);
  const range = getVelocityLayerRange(layers, index);
  if (!range) {
    return undefined;
  }

  return {
    ...range,
    index,
    label: getVelocityLayerLabel(layers.length, index),
    rangeLabel: `${range.minVelocity}-${range.maxVelocity}`,
  };
};

export const getInitialVelocityLayerId = (
  layers: readonly VelocityLayer[],
  requestedLayerId?: string,
): string => {
  if (requestedLayerId && layers.some(layer => layer.id === requestedLayerId)) {
    return requestedLayerId;
  }
  return getReferenceVelocityLayer(layers)?.id || layers[0]?.id || '';
};

export const addDraftVelocityLayer = (
  layers: readonly VelocityLayer[],
  selectedLayerId: string,
): VelocityLayerDraftTransition => {
  if (layers.length >= MAX_EDITOR_VELOCITY_LAYERS) {
    return {
      layers: cloneLayers(layers),
      selectedLayerId,
    };
  }

  const selectedIndex = layers.findIndex(layer => layer.id === selectedLayerId);
  const nextLayers = splitVelocityLayer(layers, selectedLayerId);
  const didSplit = nextLayers.length === layers.length + 1;
  return {
    layers: nextLayers,
    selectedLayerId: didSplit
      ? nextLayers[selectedIndex + 1].id
      : selectedLayerId,
  };
};

export const removeDraftVelocityLayer = (
  layers: readonly VelocityLayer[],
  selectedLayerId: string,
): VelocityLayerDraftTransition => {
  const selectedIndex = layers.findIndex(layer => layer.id === selectedLayerId);
  const nextLayers = removeVelocityLayer(layers, selectedLayerId);
  if (nextLayers.length === layers.length) {
    return {
      layers: nextLayers,
      selectedLayerId,
    };
  }

  return {
    layers: nextLayers,
    selectedLayerId: nextLayers[Math.max(0, selectedIndex - 1)]?.id
      || nextLayers[0]?.id
      || '',
  };
};

export const setDraftLayerMinVelocity = (
  layers: readonly VelocityLayer[],
  layerId: string,
  minVelocity: number,
): VelocityLayer[] => {
  const layerIndex = layers.findIndex(layer => layer.id === layerId);
  const precedingLayer = layers[layerIndex - 1];
  if (!precedingLayer) {
    return cloneLayers(layers);
  }
  return setVelocityLayerBoundary(layers, precedingLayer.id, minVelocity - 1);
};

export const setDraftLayerMaxVelocity = (
  layers: readonly VelocityLayer[],
  layerId: string,
  maxVelocity: number,
): VelocityLayer[] => setVelocityLayerBoundary(layers, layerId, maxVelocity);

export const setDraftLayerSample = (
  layers: readonly VelocityLayer[],
  layerId: string,
  sampleId: string,
): VelocityLayer[] => layers.map(layer => (
  layer.id === layerId
    ? { ...layer, sampleId }
    : { ...layer }
));

export const setDraftLayerAlignment = (
  layers: readonly VelocityLayer[],
  layerId: string,
  alignmentOffset: number,
): VelocityLayer[] => {
  if (!Number.isFinite(alignmentOffset)) {
    return cloneLayers(layers);
  }
  return layers.map(layer => (
    layer.id === layerId
      ? { ...layer, alignmentOffset: Math.max(0, alignmentOffset) }
      : { ...layer }
  ));
};

type ApplySavedSampleToDraftInput = {
  layers: readonly VelocityLayer[];
  selectedLayerId: string;
  savedSampleId: string;
  replacedSampleId?: string;
  alignmentTransform: SampleAlignmentTransform;
};

export const applySavedSampleToDraft = ({
  layers,
  selectedLayerId,
  savedSampleId,
  replacedSampleId,
  alignmentTransform,
}: ApplySavedSampleToDraftInput): VelocityLayer[] => layers.map((layer) => {
  const shouldUpdate = replacedSampleId
    ? layer.sampleId === replacedSampleId
    : layer.id === selectedLayerId;
  return shouldUpdate
    ? {
      ...layer,
      sampleId: savedSampleId,
      alignmentOffset: transformSampleAlignmentOffset(
        layer.alignmentOffset,
        alignmentTransform,
      ),
    }
    : { ...layer };
});

export const setDraftLayerTrim = (
  layers: readonly VelocityLayer[],
  layerId: string,
  trimDb: number,
): VelocityLayer[] => {
  if (!Number.isFinite(trimDb)) {
    return cloneLayers(layers);
  }
  const normalizedTrim = clamp(trimDb, MIN_LAYER_TRIM_DB, MAX_LAYER_TRIM_DB);
  return layers.map(layer => (
    layer.id === layerId
      ? { ...layer, trimDb: normalizedTrim }
      : { ...layer }
  ));
};

export const isValidVelocityLayerDraft = (
  layers: readonly VelocityLayer[],
): boolean => validateVelocityLayers(layers).length === 0;

export const getLayerWorkspaceAriaLabel = (
  label: string,
  rangeLabel: string,
): string => `Edit ${label} ${rangeLabel} sample waveform`;
