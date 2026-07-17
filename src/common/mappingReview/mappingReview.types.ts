import type {
  KitChannelMappingResult,
  TargetKitChannel,
} from '../percussion';
import type {
  FactoryPresetChannel,
  PatternPack,
} from '../sequencerModel';

export type MappingReviewKitPreset = {
  name: string;
  kitId?: string;
  channels: FactoryPresetChannel[];
  [key: string]: unknown;
};

export type MappingReviewOperation =
  | {
    type: 'kitPreset';
    preset: MappingReviewKitPreset;
  }
  | {
    type: 'patternPack';
    patternPack: PatternPack;
  };

export type PendingMappingReview = {
  operation: MappingReviewOperation;
  mappingResult: KitChannelMappingResult;
  targetKitChannels: TargetKitChannel[];
};

export type MappingReviewState = {
  pending: PendingMappingReview | null;
};

