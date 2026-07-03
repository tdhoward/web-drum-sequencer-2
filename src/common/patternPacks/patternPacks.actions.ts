import { resolveKitChannelMapping } from '../percussion';
import { setSwing, setBPM } from '../tempo';
import { replacePatternLanes } from '../patterns';
import { setNotes } from '../notes';
import { channelsStateSelector } from '../channels';
import {
  mappingToAssignments,
  replaceKitChannelAssignments,
} from '../kitChannelAssignments';
import { setSelectedChannel } from '../master';
import { setPattern } from '../song';
import type { KitChannel, PatternPack, SequencerRootState } from '../sequencerModel';
import { setSelectedPatternPack } from './patternPacks.reducer';

type Dispatch = (action: unknown) => void;

const getSelectedKitChannels = (state: SequencerRootState): KitChannel[] => {
  const selectedKitId = state.song?.selectedKitId;
  const selectedKit = selectedKitId ? state.kits?.entities?.[selectedKitId] : undefined;
  const kitChannels = channelsStateSelector(state);
  const channelIds = selectedKit?.channelIds || kitChannels.ids || [];
  return channelIds
    .map(channelId => kitChannels.entities[channelId])
    .filter((channel): channel is KitChannel => Boolean(channel));
};

export const loadPatternPack = (patternPack: PatternPack) => (
  dispatch: Dispatch,
  getState: () => SequencerRootState,
) => {
  const state = getState();
  const targetKitChannels = getSelectedKitChannels(state);
  const mappingResult = resolveKitChannelMapping({
    patternLanes: patternPack.lanes,
    sourceKitChannels: patternPack.lanes,
    targetKitChannels,
  });

  dispatch(setBPM(patternPack.bpm));
  dispatch(setSwing(patternPack.swing));
  dispatch(replacePatternLanes(patternPack.lanes.map(lane => lane.laneId || lane.id)));
  dispatch(setNotes(patternPack.notes));
  dispatch(replaceKitChannelAssignments({
    assignments: mappingToAssignments(mappingResult.mappings, targetKitChannels),
  }));
  dispatch(setPattern(0));
  dispatch(setSelectedChannel(mappingResult.mappings[0]?.laneId || patternPack.lanes[0]?.laneId));
  dispatch(setSelectedPatternPack(patternPack.id));

  return mappingResult;
};
