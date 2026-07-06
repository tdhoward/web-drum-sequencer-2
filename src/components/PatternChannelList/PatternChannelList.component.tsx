import React from 'react';
import styled from 'styled-components';
import { Sortable } from '@shopify/draggable';
import { Box } from '../design-system';
import { PatternChannel } from '../PatternChannel';
import type { LegacyChannel } from '../../common';

type PatternChannelListComponentProps = {
  channels: LegacyChannel[];
  onUpdateChannelOrder: (oldIndex: number, newIndex: number) => void;
};

const PatternChannelListBox = styled(Box)`
  outline: none;
`;

export class PatternChannelListComponent extends React.Component<PatternChannelListComponentProps> {
  channelContainer: HTMLDivElement | null = null;

  sortable: Sortable | null = null;

  componentDidMount() {
    if (!this.channelContainer) {
      return;
    }

    this.sortable = new Sortable([this.channelContainer], {
      draggable: '.wds-draggable',
      handle: '.wds-channel-handle',
      mirror: {
        constrainDimensions: true,
      },
    });

    this.sortable.on('sortable:stop', ({ oldIndex, newIndex }) => {
      const { onUpdateChannelOrder } = this.props;
      onUpdateChannelOrder(oldIndex, newIndex);
    });
  }

  componentWillUnmount() {
    this.sortable?.destroy();
  }

  render() {
    const { channels } = this.props;
    return (
      <PatternChannelListBox mt={2} ref={(el) => { this.channelContainer = el; }}>
        {channels.map(channel => <PatternChannel key={channel.id} channel={channel} />)}
      </PatternChannelListBox>
    );
  }
}
