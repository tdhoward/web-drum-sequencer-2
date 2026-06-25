import React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import { Sortable } from '@shopify/draggable';
import { detuneSupported } from '../../services/featureChecks';
import { Box, Image, Text } from '../design-system';
import { InfoKnob } from '../InfoKnob.component';
import { HitButton } from '../Channel/HitButton.component';
import { ChannelHeaderLabel } from '../ChannelHeader/ChannelHeaderLabel.component';
import { MuteSolo } from '../MuteSolo';
import { SampleWaveform } from '../SampleWaveform.component';
import { SampleSelect } from '../SampleSelect';
import construction from '../../assets/images/construction-light.svg';

const kitChannelGridColumns = 'minmax(8rem, 11rem) 1.2rem 3rem 15rem minmax(10rem, 1fr) repeat(4, 5.125rem)';

const KitChannelList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
`;

const KitChannelHeaderBar = styled.div`
  align-items: center;
  background-color: black;
  display: grid;
  gap: 0.75rem;
  grid-template-columns: ${kitChannelGridColumns};
  padding: 0 0.8rem;
`;

const KitChannelRow = styled.div`
  align-items: center;
  background-color: ${({ theme }) => theme.colors.darkGray};
  border-radius: 0.3rem;
  display: grid;
  gap: 0.75rem;
  grid-template-columns: ${kitChannelGridColumns};
  padding: 0.5rem 0.8rem;

  @media (max-width: 1120px) {
    grid-template-columns: ${kitChannelGridColumns};
  }

  @media (max-width: 820px) {
    align-items: flex-start;
    display: flex;
    flex-wrap: wrap;
  }

  &.draggable-source--is-dragging {
    opacity: 0.2;
  }

  &.draggable-mirror {
    opacity: 0.9;
    z-index: 10;
  }
`;

const KnobCell = styled(Box)`
  display: flex;
  justify-content: center;
  min-width: 0;
`;

const WaveformCell = styled(Box)`
  min-width: 0;
`;

const MoveImage = styled(Image)`
  cursor: move;
  opacity: 0.2;
  transition: opacity 0.1s;

  &:hover, &:focus, &:active {
    opacity: 0.3;
  }
`;

const getKitChannelId = channel => channel.kitChannelId || channel.id;

const getSampleSelectChannel = channel => ({
  ...channel,
  id: getKitChannelId(channel),
});

const getKitEditChannel = getSampleSelectChannel;

export const KitChannelHeader = () => (
  <KitChannelHeaderBar>
    <ChannelHeaderLabel>Channel</ChannelHeaderLabel>
    <Box />
    <ChannelHeaderLabel centerText>Hit</ChannelHeaderLabel>
    <ChannelHeaderLabel>Sample</ChannelHeaderLabel>
    <ChannelHeaderLabel centerText>Waveform</ChannelHeaderLabel>
    <ChannelHeaderLabel centerText>Pitch</ChannelHeaderLabel>
    <ChannelHeaderLabel centerText>Pan</ChannelHeaderLabel>
    <ChannelHeaderLabel centerText>Vol</ChannelHeaderLabel>
    <ChannelHeaderLabel centerText>Reverb</ChannelHeaderLabel>
  </KitChannelHeaderBar>
);

export class KitChannelControlsComponent extends React.Component {
  componentDidMount() {
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
    if (this.sortable) {
      this.sortable.destroy();
    }
  }

  render() {
    const {
      channels,
      onPressHitButton,
      onSetGain,
      onSetPan,
      onSetChannelPitchCoarse,
      onSetReverb,
    } = this.props;

    return (
      <KitChannelList ref={(el) => { this.channelContainer = el; }}>
        {channels.map(channel => (
          <KitChannelRow key={getKitChannelId(channel)} className="wds-draggable">
            <Box alignItems="center" display="flex" minWidth="0">
              <MoveImage
                src={construction}
                height="2.5rem"
                mr={3}
                userSelect="none"
                className="wds-channel-handle"
              />
              <Text color="nearWhite" fontSize={2} lineHeight="1.2em">
                {channel.name || channel.id}
              </Text>
            </Box>
            <Box alignItems="center" display="flex" height="100%" justifyContent="center">
              <MuteSolo channel={getKitEditChannel(channel)} />
            </Box>
            <Box alignItems="center" display="flex" justifyContent="center">
              <HitButton
                channel={channel}
                onMouseDown={() => onPressHitButton(channel)}
              />
            </Box>
            <Box minWidth="0">
              <SampleSelect channel={getSampleSelectChannel(channel)} showLabel={false} />
            </Box>
            <WaveformCell>
              <SampleWaveform sampleUrl={channel.sample} />
            </WaveformCell>
            {detuneSupported ? (
              <KnobCell>
                <InfoKnob
                  label="PITCH"
                  minLabel="-24"
                  maxLabel="24"
                  min="-24"
                  max="24"
                  value={channel.pitchCoarse || 0}
                  onChange={event => onSetChannelPitchCoarse(channel, event)}
                  showLabel={false}
                />
              </KnobCell>
            ) : (
              <KnobCell />
            )}
            <KnobCell>
              <InfoKnob
                label="PAN"
                minLabel="L"
                maxLabel="R"
                min="-1"
                max="1"
                step="0.1"
                value={channel.pan || 0}
                onChange={event => onSetPan(channel, event)}
                showLabel={false}
              />
            </KnobCell>
            <KnobCell>
              <InfoKnob
                label="VOL"
                minLabel="0"
                maxLabel="1"
                value={(channel.gain || 0) * 100}
                onChange={event => onSetGain(channel, event)}
                showLabel={false}
              />
            </KnobCell>
            <KnobCell>
              <InfoKnob
                label="REVERB"
                minLabel="0"
                maxLabel="1"
                min="0"
                max="1"
                step="0.01"
                value={channel.reverb || 0}
                onChange={event => onSetReverb(channel, event)}
                showLabel={false}
              />
            </KnobCell>
          </KitChannelRow>
        ))}
      </KitChannelList>
    );
  }
}

KitChannelControlsComponent.propTypes = {
  channels: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    kitChannelId: PropTypes.string,
    name: PropTypes.string,
    sample: PropTypes.string.isRequired,
    pitchCoarse: PropTypes.number,
    reverb: PropTypes.number,
    gain: PropTypes.number,
    pan: PropTypes.number,
  })).isRequired,
  onPressHitButton: PropTypes.func.isRequired,
  onUpdateChannelOrder: PropTypes.func.isRequired,
  onSetGain: PropTypes.func.isRequired,
  onSetPan: PropTypes.func.isRequired,
  onSetChannelPitchCoarse: PropTypes.func.isRequired,
  onSetReverb: PropTypes.func.isRequired,
};
