import type { KitChannelMapping } from '../percussion';
import type { KitChannelAssignment, KitChannelInput } from '../sequencerModel';

type AssignmentTargetKitChannel = KitChannelInput & {
  kitId: string;
};

export const mappingToAssignments = (
  mappings: KitChannelMapping[],
  targetKitChannels: AssignmentTargetKitChannel[],
): KitChannelAssignment[] => {
  const channelsById = targetKitChannels.reduce<Record<string, AssignmentTargetKitChannel>>(
    (entities, channel) => ({
      ...entities,
      [channel.id]: channel,
    }),
    {},
  );

  return mappings.map((mapping) => {
    const targetChannel = channelsById[mapping.targetKitChannelId];
    return {
      id: mapping.targetKitChannelId,
      kitId: targetChannel.kitId,
      laneId: mapping.laneId,
      kitChannelId: mapping.targetKitChannelId,
      confidence: mapping.confidence,
      reason: mapping.reason,
    };
  });
};
