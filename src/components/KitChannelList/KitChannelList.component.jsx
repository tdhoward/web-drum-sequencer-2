import React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import { Sortable } from '@shopify/draggable';
import { detuneSupported } from '../../services/featureChecks';
import {
  Box,
  Image,
  Text,
  TextInput,
} from '../design-system';
import { InfoKnob } from '../InfoKnob.component';
import { HitButton } from '../ChannelButtons';
import { ChannelHeaderLabel } from '../ChannelHeaderLabel.component';
import { MuteSolo } from '../MuteSolo';
import { SampleWaveform } from '../SampleWaveform.component';
import { SampleSelect } from '../SampleSelect';
import { AddChannelButton } from '../AddChannelButton';
import { RemoveButton } from '../ChannelButtons';
import construction from '../../assets/images/construction-light.svg';

const kitChannelGridColumns = 'minmax(8rem, 11rem) 1.2rem 3rem 15rem minmax(10rem, 1fr) repeat(4, 5.125rem) 2rem';

const KitChannelListBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
`;

const KitChannelHeaderBar = styled.div`
  align-items: center;
  background-color: ${({ theme }) => theme.colors.channelHeaderBackground};
  display: grid;
  gap: 0.75rem;
  grid-template-columns: ${kitChannelGridColumns};
  padding: 0 0.8rem;
`;

const KitChannelRow = styled.div`
  align-items: center;
  background-color: ${({ theme }) => theme.colors.surfacePanelRaised};
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

const ChannelNameButton = styled.button`
  background: transparent;
  border: 0;
  color: ${({ theme }) => theme.colors.nearWhite};
  cursor: text;
  font: inherit;
  line-height: 1.2em;
  min-width: 0;
  overflow: hidden;
  padding: 0;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;

  &:focus {
    outline: 1px solid ${({ theme }) => theme.colors.borderHover};
    outline-offset: 0.2rem;
  }
`;

const ChannelNameInput = styled(TextInput)`
  background: ${({ theme }) => theme.colors.surfaceControl};
  border-radius: 0.2rem;
  color: ${({ theme }) => theme.colors.nearWhite};
  font: inherit;
  line-height: 1.2em;
  min-width: 0;
  padding: 0.25rem 0.35rem;
  width: 100%;

  &:focus {
    outline: 1px solid ${({ theme }) => theme.colors.borderHover};
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
    <ChannelHeaderLabel centerText>Del</ChannelHeaderLabel>
  </KitChannelHeaderBar>
);

export class KitChannelListComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      editingChannelId: null,
      channelNameDraft: '',
    };
    this.startEditingChannelName = this.startEditingChannelName.bind(this);
    this.setChannelNameDraft = this.setChannelNameDraft.bind(this);
    this.commitChannelName = this.commitChannelName.bind(this);
    this.cancelChannelNameEdit = this.cancelChannelNameEdit.bind(this);
    this.handleChannelNameKeyDown = this.handleChannelNameKeyDown.bind(this);
  }

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

  componentDidUpdate(prevProps, prevState) {
    if (this.state.editingChannelId !== prevState.editingChannelId && this.nameInput) {
      this.nameInput.focus();
      this.nameInput.select();
    }
  }

  componentWillUnmount() {
    if (this.sortable) {
      this.sortable.destroy();
    }
  }

  startEditingChannelName(channel) {
    this.setState({
      editingChannelId: getKitChannelId(channel),
      channelNameDraft: channel.name || channel.id,
    });
  }

  setChannelNameDraft(event) {
    this.setState({
      channelNameDraft: event.target.value,
    });
  }

  commitChannelName(channel) {
    const { onSetChannelName } = this.props;
    const channelId = getKitChannelId(channel);
    const nextName = this.state.channelNameDraft.trim();
    const currentName = channel.name || '';

    if (nextName && nextName !== currentName) {
      onSetChannelName(channel, nextName);
    }

    if (this.state.editingChannelId === channelId) {
      this.setState({
        editingChannelId: null,
        channelNameDraft: '',
      });
    }
  }

  cancelChannelNameEdit() {
    this.setState({
      editingChannelId: null,
      channelNameDraft: '',
    });
  }

  handleChannelNameKeyDown(channel, event) {
    if (event.key === 'Enter') {
      this.commitChannelName(channel);
    }

    if (event.key === 'Escape') {
      this.cancelChannelNameEdit();
    }
  }

  render() {
    const {
      channels,
      onPressHitButton,
      onPressRemove,
      onSetGain,
      onSetPan,
      onSetChannelPitchCoarse,
      onSetReverb,
    } = this.props;
    const { editingChannelId, channelNameDraft } = this.state;

    return (
      <KitChannelListBox ref={(el) => { this.channelContainer = el; }}>
        {channels.map((channel) => {
          const channelId = getKitChannelId(channel);
          const isEditingName = editingChannelId === channelId;

          return (
            <KitChannelRow key={channelId} className="wds-draggable">
              <Box alignItems="center" display="flex" minWidth="0">
                <MoveImage
                  src={construction}
                  height="2.5rem"
                  mr={3}
                  userSelect="none"
                  aria-hidden="true"
                  className="wds-channel-handle"
                />
                {isEditingName ? (
                  <ChannelNameInput
                    ref={(input) => { this.nameInput = input; }}
                    aria-label="Channel name"
                    fontSize={2}
                    value={channelNameDraft}
                    onBlur={() => this.commitChannelName(channel)}
                    onChange={this.setChannelNameDraft}
                    onKeyDown={event => this.handleChannelNameKeyDown(channel, event)}
                  />
                ) : (
                  <ChannelNameButton
                    type="button"
                    onDoubleClick={() => this.startEditingChannelName(channel)}
                    title="Double-click to rename"
                  >
                    <Text as="span" color="nearWhite" fontSize={2} lineHeight="1.2em">
                      {channel.name || channel.id}
                    </Text>
                  </ChannelNameButton>
                )}
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
              <Box alignItems="center" display="flex" justifyContent="center">
                <RemoveButton onClick={() => onPressRemove(channel)} />
              </Box>
            </KitChannelRow>
          );
        })}
        <AddChannelButton />
      </KitChannelListBox>
    );
  }
}

KitChannelListComponent.propTypes = {
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
  onPressRemove: PropTypes.func.isRequired,
  onUpdateChannelOrder: PropTypes.func.isRequired,
  onSetGain: PropTypes.func.isRequired,
  onSetChannelName: PropTypes.func.isRequired,
  onSetPan: PropTypes.func.isRequired,
  onSetChannelPitchCoarse: PropTypes.func.isRequired,
  onSetReverb: PropTypes.func.isRequired,
};
