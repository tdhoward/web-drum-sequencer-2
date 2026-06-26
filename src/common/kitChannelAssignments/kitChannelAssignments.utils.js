export const mappingToAssignments = (mappings, targetKitChannels) => {
  const channelsById = targetKitChannels.reduce((entities, channel) => ({
    ...entities,
    [channel.id]: channel,
  }), {});

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
