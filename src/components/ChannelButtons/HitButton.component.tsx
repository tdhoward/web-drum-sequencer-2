import React, { type TouchEvent } from 'react';
import { HoverButton } from '../design-system';

type HitButtonChannel = {
  sample?: string | {
    name?: string;
  };
  name?: string;
  id?: string;
};

type HitButtonProps = {
  channel: HitButtonChannel;
  onMouseDown: () => void;
};

const getSampleLabel = (channel: HitButtonChannel): string => {
  if (typeof channel.sample === 'string') {
    return channel.name || channel.sample || channel.id || 'channel';
  }

  return channel.sample?.name || channel.name || channel.id || 'channel';
};

export const HitButton = ({ channel, onMouseDown }: HitButtonProps) => (
  <HoverButton
    height={40}
    width={40}
    minWidth={40}
    bg="hitButtonBackground"
    hoverBg="hitButtonBackgroundHover"
    activeBg="hitButtonBackgroundActive"
    transitionSpeed="0.1s"
    ml={2}
    p={0}
    onMouseDown={() => onMouseDown()}
    onTouchStart={() => onMouseDown()}
    onTouchEnd={(event: TouchEvent<HTMLButtonElement>) => event.preventDefault()}
    aria-label={`Play ${getSampleLabel(channel)}`}
  />
);
