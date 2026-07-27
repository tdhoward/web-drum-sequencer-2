export const SILENT_MIDI_VELOCITY = 0;
export const MIN_AUDIBLE_MIDI_VELOCITY = 1;
export const DEFAULT_MIDI_VELOCITY = 64;
export const MAX_MIDI_VELOCITY = 127;

export const sampleIdFromUrl = (url?: string): string => `sample:${url}`;

export type VelocityLayerInput = {
  id?: string;
  sample?: string;
  sampleId?: string;
  maxVelocity?: number;
  alignmentOffset?: number;
  trimDb?: number;
};

export type VelocityLayer = {
  id: string;
  sampleId: string;
  maxVelocity: number;
  alignmentOffset: number;
  trimDb: number;
};

export type VelocityLayerRange = {
  minVelocity: number;
  maxVelocity: number;
};

export type SampleAlignmentTransform = {
  trimStartSeconds: number;
  renderedDuration: number;
};

export type VelocityLayerChannelInput = {
  id: string;
  sample?: string;
  sampleId?: string;
  alignmentOffset?: number;
  velocityLayers?: VelocityLayerInput[];
};

export type VelocityLayerSampleLookup = {
  entities?: Record<string, {
    alignmentOffset?: number;
    url?: string;
  } | undefined>;
};

export type VelocityLayerSampleReference = {
  sampleId: string;
  sample?: string;
};

const clamp = (value: number, min: number, max: number): number => (
  Math.min(max, Math.max(min, value))
);

export const transformSampleAlignmentOffset = (
  alignmentOffset: number,
  transform: SampleAlignmentTransform,
): number => {
  const safeOffset = Number.isFinite(alignmentOffset) ? Math.max(0, alignmentOffset) : 0;
  const trimStartSeconds = Number.isFinite(transform.trimStartSeconds)
    ? Math.max(0, transform.trimStartSeconds)
    : 0;
  const renderedDuration = Number.isFinite(transform.renderedDuration)
    ? Math.max(0, transform.renderedDuration)
    : 0;
  return clamp(safeOffset - trimStartSeconds, 0, renderedDuration);
};

const isFiniteNumber = (value: unknown): value is number => (
  typeof value === 'number' && Number.isFinite(value)
);

const normalizeAlignmentOffset = (value: unknown, fallback = 0): number => (
  isFiniteNumber(value) && value >= 0 ? value : fallback
);

const normalizeTrimDb = (value: unknown): number => (
  isFiniteNumber(value) ? value : 0
);

export const normalizeMidiVelocity = (
  velocity: unknown,
  fallback = DEFAULT_MIDI_VELOCITY,
): number => (
  isFiniteNumber(velocity)
    ? clamp(Math.round(velocity), SILENT_MIDI_VELOCITY, MAX_MIDI_VELOCITY)
    : fallback
);

export const noteVelocityToGain = (velocity: number): number => {
  const normalizedVelocity = normalizeMidiVelocity(velocity);
  return normalizedVelocity <= DEFAULT_MIDI_VELOCITY
    ? normalizedVelocity / DEFAULT_MIDI_VELOCITY
    : 1 + (
      (normalizedVelocity - DEFAULT_MIDI_VELOCITY)
      / (MAX_MIDI_VELOCITY - DEFAULT_MIDI_VELOCITY)
    );
};

export const legacyVelocityToMidiVelocity = (velocity: unknown): number => {
  if (!isFiniteNumber(velocity)) {
    return DEFAULT_MIDI_VELOCITY;
  }

  const normalizedGain = clamp(velocity, 0, 2);
  return normalizeMidiVelocity(
    normalizedGain <= 1
      ? normalizedGain * DEFAULT_MIDI_VELOCITY
      : DEFAULT_MIDI_VELOCITY + (
        (normalizedGain - 1)
        * (MAX_MIDI_VELOCITY - DEFAULT_MIDI_VELOCITY)
      ),
  );
};

const getSampleAlignmentOffset = (
  sampleId: string,
  samples?: VelocityLayerSampleLookup,
): number => normalizeAlignmentOffset(samples?.entities?.[sampleId]?.alignmentOffset);

const getUniqueLayerId = (
  channelId: string,
  inputId: unknown,
  index: number,
  usedIds: Set<string>,
): string => {
  const fallbackId = `${channelId}:layer:${index + 1}`;
  const baseId = typeof inputId === 'string' && inputId.length > 0
    ? inputId
    : fallbackId;
  let id = baseId;
  let suffix = 2;

  while (usedIds.has(id)) {
    id = `${baseId}:${suffix}`;
    suffix += 1;
  }
  usedIds.add(id);
  return id;
};

const getDefaultBoundary = (index: number, layerCount: number): number => (
  Math.round(((index + 1) * MAX_MIDI_VELOCITY) / layerCount)
);

export const getVelocityLayerSampleReferences = (
  channel: VelocityLayerChannelInput,
): VelocityLayerSampleReference[] => {
  const legacySampleId = channel.sampleId || sampleIdFromUrl(channel.sample);
  const inputs = channel.velocityLayers?.length
    ? channel.velocityLayers
    : [{
      sample: channel.sample,
      sampleId: legacySampleId,
    }];

  return inputs.map((input) => {
    const sampleId = input.sampleId || (
      typeof input.sample === 'string'
        ? sampleIdFromUrl(input.sample)
        : legacySampleId
    );
    const sample = input.sample || (
      sampleId === legacySampleId ? channel.sample : undefined
    );
    return {
      sampleId,
      ...(sample ? { sample } : {}),
    };
  });
};

/**
 * Import-boundary normalization is intentionally forgiving: missing scalar
 * fields receive deterministic defaults and malformed boundaries are clamped
 * into a complete ordered partition. More than 127 layers cannot form a MIDI
 * velocity partition and fail with a RangeError. Editor operations below
 * expect a valid normalized partition and treat unknown or impossible edits as
 * immutable no-ops.
 */
export const normalizeVelocityLayers = (
  channel: VelocityLayerChannelInput,
  samples?: VelocityLayerSampleLookup,
): VelocityLayer[] => {
  const legacySampleId = channel.sampleId || sampleIdFromUrl(channel.sample);
  const inputs = channel.velocityLayers?.length
    ? channel.velocityLayers
    : [{
      id: `${channel.id}:layer:1`,
      sampleId: legacySampleId,
      maxVelocity: MAX_MIDI_VELOCITY,
      alignmentOffset: normalizeAlignmentOffset(
        channel.alignmentOffset,
        getSampleAlignmentOffset(legacySampleId, samples),
      ),
      trimDb: 0,
    }];

  if (inputs.length > MAX_MIDI_VELOCITY) {
    throw new RangeError(
      `Velocity layers cannot contain more than ${MAX_MIDI_VELOCITY} entries`,
    );
  }

  const usedIds = new Set<string>();
  let precedingBoundary = SILENT_MIDI_VELOCITY;

  return inputs.map((input, index) => {
    const isFinalLayer = index === inputs.length - 1;
    const remainingLayerCount = inputs.length - index - 1;
    const minimumBoundary = precedingBoundary + 1;
    const maximumBoundary = MAX_MIDI_VELOCITY - remainingLayerCount;
    const requestedBoundary = isFiniteNumber(input.maxVelocity)
      ? Math.round(input.maxVelocity)
      : getDefaultBoundary(index, inputs.length);
    const maxVelocity = isFinalLayer
      ? MAX_MIDI_VELOCITY
      : clamp(requestedBoundary, minimumBoundary, maximumBoundary);
    const sampleId = input.sampleId || (
      typeof input.sample === 'string'
        ? sampleIdFromUrl(input.sample)
        : legacySampleId
    );
    const alignmentOffset = normalizeAlignmentOffset(
      input.alignmentOffset,
      getSampleAlignmentOffset(sampleId, samples),
    );

    precedingBoundary = maxVelocity;
    return {
      id: getUniqueLayerId(channel.id, input.id, index, usedIds),
      sampleId,
      maxVelocity,
      alignmentOffset,
      trimDb: normalizeTrimDb(input.trimDb),
    };
  });
};

export const normalizeVelocityLayerInputs = (
  channel: VelocityLayerChannelInput,
  samples?: VelocityLayerSampleLookup,
): VelocityLayerInput[] => {
  const references = getVelocityLayerSampleReferences(channel);
  return normalizeVelocityLayers(channel, samples).map((layer, index) => {
    const sample = references[index]?.sample
      || samples?.entities?.[layer.sampleId]?.url;
    return {
      ...layer,
      ...(sample ? { sample } : {}),
    };
  });
};

export const getVelocityLayerRange = (
  layers: readonly VelocityLayer[],
  index: number,
): VelocityLayerRange | undefined => {
  const layer = layers[index];
  if (!layer) {
    return undefined;
  }

  return {
    minVelocity: index === 0
      ? MIN_AUDIBLE_MIDI_VELOCITY
      : layers[index - 1].maxVelocity + 1,
    maxVelocity: layer.maxVelocity,
  };
};

export const getVelocityLayerForVelocity = (
  layers: readonly VelocityLayer[],
  velocity: number,
): VelocityLayer | undefined => {
  if (
    !Number.isInteger(velocity)
    || velocity < MIN_AUDIBLE_MIDI_VELOCITY
    || velocity > MAX_MIDI_VELOCITY
  ) {
    return undefined;
  }

  return layers.find(layer => velocity <= layer.maxVelocity);
};

export const getReferenceVelocityLayer = (
  layers: readonly VelocityLayer[],
): VelocityLayer | undefined => (
  getVelocityLayerForVelocity(layers, DEFAULT_MIDI_VELOCITY)
);

const cloneVelocityLayers = (layers: readonly VelocityLayer[]): VelocityLayer[] => (
  layers.map(layer => ({ ...layer }))
);

const createSplitLayerId = (
  layers: readonly VelocityLayer[],
  layerId: string,
): string => {
  const existingIds = new Set(layers.map(layer => layer.id));
  const baseId = `${layerId}:split`;
  let id = baseId;
  let suffix = 2;

  while (existingIds.has(id)) {
    id = `${baseId}:${suffix}`;
    suffix += 1;
  }
  return id;
};

export const splitVelocityLayer = (
  layers: readonly VelocityLayer[],
  layerId: string,
): VelocityLayer[] => {
  const layerIndex = layers.findIndex(layer => layer.id === layerId);
  const range = getVelocityLayerRange(layers, layerIndex);
  if (layerIndex < 0 || !range || range.minVelocity === range.maxVelocity) {
    return cloneVelocityLayers(layers);
  }

  const splitBoundary = Math.floor((range.minVelocity + range.maxVelocity) / 2);
  const splitLayer = layers[layerIndex];
  return layers.flatMap((layer, index) => {
    if (index !== layerIndex) {
      return [{ ...layer }];
    }

    return [
      {
        ...layer,
        maxVelocity: splitBoundary,
      },
      {
        ...splitLayer,
        id: createSplitLayerId(layers, splitLayer.id),
      },
    ];
  });
};

export const removeVelocityLayer = (
  layers: readonly VelocityLayer[],
  layerId: string,
): VelocityLayer[] => {
  const layerIndex = layers.findIndex(layer => layer.id === layerId);
  if (layers.length <= 1 || layerIndex < 0) {
    return cloneVelocityLayers(layers);
  }

  if (layerIndex === 0) {
    return layers.slice(1).map(layer => ({ ...layer }));
  }

  const removedBoundary = layers[layerIndex].maxVelocity;
  return layers
    .filter((_, index) => index !== layerIndex)
    .map((layer, index) => (
      index === layerIndex - 1
        ? { ...layer, maxVelocity: removedBoundary }
        : { ...layer }
    ));
};

export const setVelocityLayerBoundary = (
  layers: readonly VelocityLayer[],
  layerId: string,
  maxVelocity: number,
): VelocityLayer[] => {
  const layerIndex = layers.findIndex(layer => layer.id === layerId);
  const nextLayer = layers[layerIndex + 1];
  if (
    layerIndex < 0
    || !nextLayer
    || !isFiniteNumber(maxVelocity)
  ) {
    return cloneVelocityLayers(layers);
  }

  const precedingBoundary = layerIndex === 0
    ? SILENT_MIDI_VELOCITY
    : layers[layerIndex - 1].maxVelocity;
  const normalizedBoundary = clamp(
    Math.round(maxVelocity),
    precedingBoundary + 1,
    nextLayer.maxVelocity - 1,
  );

  return layers.map((layer, index) => (
    index === layerIndex
      ? { ...layer, maxVelocity: normalizedBoundary }
      : { ...layer }
  ));
};

export const validateVelocityLayers = (
  layers: readonly VelocityLayerInput[],
): string[] => {
  const errors: string[] = [];
  if (layers.length === 0) {
    return ['velocityLayers must contain at least one layer'];
  }

  const layerIds = new Set<string>();
  layers.forEach((layer, index) => {
    const layerLabel = `velocityLayers[${index}]`;
    const maxVelocity = layer.maxVelocity;
    if (typeof layer.id !== 'string' || layer.id.length === 0) {
      errors.push(`${layerLabel}.id must be a non-empty string`);
    } else if (layerIds.has(layer.id)) {
      errors.push(`${layerLabel}.id must be unique: ${layer.id}`);
    } else {
      layerIds.add(layer.id);
    }

    if (typeof layer.sampleId !== 'string' || layer.sampleId.length === 0) {
      errors.push(`${layerLabel}.sampleId must be a non-empty string`);
    }
    if (
      !Number.isInteger(maxVelocity)
      || (maxVelocity ?? SILENT_MIDI_VELOCITY) < MIN_AUDIBLE_MIDI_VELOCITY
      || (maxVelocity ?? SILENT_MIDI_VELOCITY) > MAX_MIDI_VELOCITY
    ) {
      errors.push(
        `${layerLabel}.maxVelocity must be an integer from `
        + `${MIN_AUDIBLE_MIDI_VELOCITY} to ${MAX_MIDI_VELOCITY}`,
      );
    }
    const precedingMaxVelocity = layers[index - 1]?.maxVelocity;
    if (
      index > 0
      && isFiniteNumber(maxVelocity)
      && isFiniteNumber(precedingMaxVelocity)
      && maxVelocity <= precedingMaxVelocity
    ) {
      errors.push(`${layerLabel}.maxVelocity must be strictly increasing`);
    }
    if (!isFiniteNumber(layer.alignmentOffset) || layer.alignmentOffset < 0) {
      errors.push(`${layerLabel}.alignmentOffset must be a non-negative finite number`);
    }
    if (!isFiniteNumber(layer.trimDb)) {
      errors.push(`${layerLabel}.trimDb must be a finite number`);
    }
  });

  if (layers[layers.length - 1].maxVelocity !== MAX_MIDI_VELOCITY) {
    errors.push(`velocityLayers must end at ${MAX_MIDI_VELOCITY}`);
  }

  return errors;
};
