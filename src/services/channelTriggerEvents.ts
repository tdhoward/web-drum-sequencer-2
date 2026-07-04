type ChannelTriggerListener = (channelId: string) => void;

const channelTriggerListeners = new Set<ChannelTriggerListener>();

export const notifyChannelTriggered = (channelId: string): void => {
  channelTriggerListeners.forEach((listener) => {
    listener(channelId);
  });
};

export const subscribeToChannelTriggers = (
  listener: ChannelTriggerListener,
): (() => void) => {
  channelTriggerListeners.add(listener);

  return () => {
    channelTriggerListeners.delete(listener);
  };
};
