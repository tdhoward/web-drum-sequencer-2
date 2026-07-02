import React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import { Sortable } from '@shopify/draggable';
import { Box } from '../design-system';
import { PatternChannel } from '../PatternChannel';

const PatternChannelListBox = styled(Box)`
  outline: none;
`;

export class PatternChannelListComponent extends React.Component {
  componentDidMount() {
    const sortable = new Sortable([this.channelContainer], {
      draggable: '.wds-draggable',
      handle: '.wds-channel-handle',
      mirror: {
        constrainDimensions: true,
      },
    });

    sortable.on('sortable:stop', ({ oldIndex, newIndex }) => {
      const { onUpdateChannelOrder } = this.props;
      onUpdateChannelOrder(oldIndex, newIndex);
    });
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

PatternChannelListComponent.propTypes = {
  channels: PropTypes.arrayOf(PropTypes.object).isRequired,
  onUpdateChannelOrder: PropTypes.func.isRequired,
};
