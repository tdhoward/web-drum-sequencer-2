import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import defaultPresets from '../../presets';
import type { ContentHashMetadata, KitChannelInput } from '../sequencerModel';
import {
  sampleIdFromUrl,
  transformSampleAlignmentOffset,
  type SampleAlignmentTransform,
} from '../velocityLayers';

export type UserPreset = {
  name: string;
  kitId?: string;
  channels?: KitChannelInput[];
  [key: string]: unknown;
} & Partial<ContentHashMetadata>;

export type PresetsState = {
  userPresets: UserPreset[];
  preset: string;
};

type RenamePresetPayload = {
  presetName: string;
  name: string;
  kitId: string;
};

type TransformSampleAlignmentsPayload = SampleAlignmentTransform & {
  sampleId: string;
};

export const presetsInitialState: PresetsState = {
  userPresets: [],
  preset: defaultPresets[1].name,
};

export const presetsSlice = createSlice({
  name: 'presets',
  initialState: presetsInitialState,
  reducers: {
    setPreset(state, action: PayloadAction<string>) {
      state.preset = action.payload;
    },
    savePreset(state, action: PayloadAction<UserPreset>) {
      state.userPresets = state.userPresets.map(
        userPreset => (userPreset.name === action.payload.name
          ? action.payload
          : userPreset),
      );
    },
    savePresetAs(state, action: PayloadAction<UserPreset>) {
      state.userPresets = [
        ...state.userPresets.filter(
          userPreset => userPreset.name !== action.payload.name,
        ),
        action.payload,
      ];
    },
    renamePreset(state, action: PayloadAction<RenamePresetPayload>) {
      const preset = state.userPresets.find(
        userPreset => userPreset.name === action.payload.presetName,
      );
      if (!preset) return;
      preset.name = action.payload.name;
      preset.kitId = action.payload.kitId;
      if (state.preset === action.payload.presetName) {
        state.preset = action.payload.name;
      }
    },
    deletePreset(state, action: PayloadAction<string>) {
      state.userPresets = state.userPresets.filter(
        userPreset => userPreset.name !== action.payload,
      );
    },
    transformPresetSampleAlignments(
      state,
      action: PayloadAction<TransformSampleAlignmentsPayload>,
    ) {
      state.userPresets.forEach((preset) => {
        let presetChanged = false;
        (preset.channels || []).forEach((channel) => {
          (channel.velocityLayers || []).forEach((layer) => {
            const layerSampleId = layer.sampleId || sampleIdFromUrl(layer.sample);
            if (layerSampleId === action.payload.sampleId) {
              layer.alignmentOffset = transformSampleAlignmentOffset(
                layer.alignmentOffset || 0,
                action.payload,
              );
              presetChanged = true;
            }
          });
        });
        if (presetChanged) {
          delete preset.contentHash;
          delete preset.contentHashAlgorithm;
          delete preset.contentHashVersion;
        }
      });
    },
  },
});

export const { transformPresetSampleAlignments } = presetsSlice.actions;

export const presetsReducer = presetsSlice.reducer;
