import React from 'react';
import styled from 'styled-components';
import { Toggles } from '../Toggles';
import {
  Box,
  Image,
  Text,
} from '../design-system';
import { HitButton } from '../ChannelButtons';
import { MuteSolo } from '../MuteSolo';
import construction from '../../assets/images/construction-light.svg';
import type { LegacyChannel } from '../../common';
import type { LegacyNotes } from '../../common/sequencerModel';

type PatternChannelComponentProps = {
  channel: LegacyChannel;
  notes: LegacyNotes;
  pattern: number;
  onPressHitButton: () => void;
  onTouchChannel: () => void;
  selectedChannelId?: string;
};

const PatternChannelBox = styled(Box)`
  outline: none;

  &.draggable-source--is-dragging {
    opacity: 0.2;
  }

  &.draggable-mirror {
    opacity: 0.9;
    z-index: 10;
  }
`;

const MoveImage = styled(Image)`
  cursor: move;
  filter: ${({ theme }) => theme.colors.channelDragHandleFilter};
  opacity: ${({ theme }) => theme.colors.channelDragHandleOpacity};
  transition: opacity 0.1s;

  &:hover, &:focus, &:active {
    opacity: ${({ theme }) => theme.colors.channelDragHandleHoverOpacity};
  }
`;

export const PatternChannelComponent = ({
  channel,
  notes,
  pattern,
  onPressHitButton,
  onTouchChannel,
  selectedChannelId,
}: PatternChannelComponentProps) => {
  const patternChannelName = channel.name || channel.kitChannelId || channel.id;
  const patternNotes = notes[channel.id]?.[pattern] || [];

  return (
    <PatternChannelBox
      width="100%"
      display="flex"
      flex="1 1 auto"
      p={1}
      alignItems="stretch"
      borderRadius={0}
      onMouseDown={onTouchChannel}
      bg={selectedChannelId === channel.id ? 'surfacePanelRaised' : 'transparent'}
      className="wds-draggable"
    >
      <Box
        bg={selectedChannelId === channel.id ? 'surfaceControlHover' : 'surfacePanelRaised'}
        width="16rem"
        p={2}
        borderRadius="0.25rem"
        mr={[2, 2, 2, 3, 4]}
        display="flex"
        alignItems="center"
        position="relative"
      >
        <MoveImage
          src={construction}
          height="2.5rem"
          mr={3}
          userSelect="none"
          aria-hidden="true"
          className="wds-channel-handle"
        />
        <Box flex="1 1 auto">
          <Text color="textPrimary" fontWeight="normal" textAlign="left" fontSize={2} userSelect="none">
            {patternChannelName}
          </Text>
        </Box>
        <MuteSolo channel={channel} />
        <HitButton channel={channel} onMouseDown={onPressHitButton} />
      </Box>
      <Toggles
        notes={patternNotes}
        channelId={channel.id}
      />
    </PatternChannelBox>
  );
};
