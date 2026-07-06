import React from 'react';
import styled from 'styled-components';
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
import {
  PERCUSSION_TYPE_OPTIONS,
  getPercussionTypeAbbreviation,
  getPercussionTypeLabel,
} from '../../common/percussion';
import construction from '../../assets/images/construction-light.svg';
import type { LegacyChannel } from '../../common';

const kitChannelGridColumns = 'minmax(8rem, 11rem) 1.2rem 3rem 15rem minmax(10rem, 1fr) repeat(4, 5.125rem) 2rem';

type KitChannelListChannel = LegacyChannel & {
  gain?: number;
  muted?: boolean;
  pan?: number;
  pitchCoarse?: number;
  reverb?: number;
  sampleLoaded?: boolean;
  solo?: boolean;
};

type KitChannelListComponentProps = {
  channels: KitChannelListChannel[];
  onPressHitButton: (channel: KitChannelListChannel) => void;
  onPressRemove: (channel: KitChannelListChannel) => void;
  onUpdateChannelOrder: (oldIndex: number, newIndex: number) => void;
  onSetGain: (channel: KitChannelListChannel, event: Event) => void;
  onSetChannelName: (channel: KitChannelListChannel, name: string) => void;
  onSetPercussionType: (channel: KitChannelListChannel, percussionType: string) => void;
  onSetPan: (channel: KitChannelListChannel, event: Event) => void;
  onSetChannelPitchCoarse: (channel: KitChannelListChannel, event: Event) => void;
  onSetReverb: (channel: KitChannelListChannel, event: Event) => void;
};

type KitChannelListComponentState = {
  editingChannelId: string | null;
  channelNameDraft: string;
  percussionMenuChannelId: string | null;
};

type PercussionTypeOptionProps = {
  $selected: boolean;
};

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

const ChannelNameGroup = styled.div`
  align-items: baseline;
  display: flex;
  min-width: 0;
  position: relative;
  width: 100%;
`;

const ChannelNameButton = styled.button`
  background: transparent;
  border: 0;
  color: ${({ theme }) => theme.colors.nearWhite};
  cursor: text;
  flex: 0 1 auto;
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
  flex: 1 1 auto;
  font: inherit;
  line-height: 1.2em;
  min-width: 0;
  padding: 0.25rem 0.35rem;
  width: 100%;

  &:focus {
    outline: 1px solid ${({ theme }) => theme.colors.borderHover};
  }
`;

const PercussionTypeButton = styled.button`
  background: transparent;
  border: 0;
  border-radius: 0.2rem;
  color: ${({ theme }) => theme.colors.textMuted};
  cursor: pointer;
  flex: 0 0 auto;
  font-size: 0.66rem;
  font-weight: 600;
  line-height: 1;
  margin-left: 0.35rem;
  padding: 0.12rem 0.16rem;
  touch-action: manipulation;

  &:hover {
    background: ${({ theme }) => theme.colors.borderSubtle};
    color: ${({ theme }) => theme.colors.textPrimary};
  }

  &:focus-visible {
    outline: 1px solid ${({ theme }) => theme.colors.borderHover};
    outline-offset: 0.12rem;
  }
`;

const PercussionTypeMenu = styled.div`
  background: ${({ theme }) => theme.colors.surfaceControl};
  border: 2px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: 0.35rem;
  box-shadow: 0 0.85rem 1.6rem rgba(0, 0, 0, 0.34);
  left: 0;
  max-height: 18rem;
  min-width: 15rem;
  overflow-y: auto;
  padding: 0.35rem;
  position: absolute;
  top: calc(100% + 0.4rem);
  z-index: 20;
`;

const PercussionTypeOption = styled.button<PercussionTypeOptionProps>`
  align-items: center;
  background: ${({ $selected, theme }) => ($selected ? theme.colors.borderSubtle : 'transparent')};
  border: 0;
  border-radius: 0.25rem;
  color: ${({ theme }) => theme.colors.textPrimary};
  cursor: pointer;
  display: grid;
  font-size: 0.76rem;
  font-weight: 600;
  gap: 0.55rem;
  grid-template-columns: 2rem 1fr;
  line-height: 1.2;
  padding: 0.42rem 0.5rem;
  text-align: left;
  touch-action: manipulation;
  width: 100%;

  &:hover {
    background: ${({ theme }) => theme.colors.borderSubtle};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accentPrimary};
    outline-offset: 1px;
  }
`;

const PercussionTypeOptionAbbreviation = styled.span<PercussionTypeOptionProps>`
  color: ${({ $selected, theme }) => ($selected ? theme.colors.accentPrimary : theme.colors.textMuted)};
  font-size: 0.68rem;
  font-weight: 600;
  line-height: 1;
`;

const PercussionTypeOptionLabel = styled.span`
  color: ${({ theme }) => theme.colors.textPrimary};
  min-width: 0;
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

const getKitChannelId = (channel: KitChannelListChannel): string => channel.kitChannelId || channel.id;

const getSampleSelectChannel = (channel: KitChannelListChannel): KitChannelListChannel => ({
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

export class KitChannelListComponent extends React.Component<
  KitChannelListComponentProps,
  KitChannelListComponentState
> {
  channelContainer: HTMLDivElement | null = null;

  nameInput: HTMLInputElement | null = null;

  sortable: Sortable | null = null;

  constructor(props: KitChannelListComponentProps) {
    super(props);
    this.state = {
      editingChannelId: null,
      channelNameDraft: '',
      percussionMenuChannelId: null,
    };
    this.startEditingChannelName = this.startEditingChannelName.bind(this);
    this.setChannelNameDraft = this.setChannelNameDraft.bind(this);
    this.commitChannelName = this.commitChannelName.bind(this);
    this.cancelChannelNameEdit = this.cancelChannelNameEdit.bind(this);
    this.handleChannelNameKeyDown = this.handleChannelNameKeyDown.bind(this);
    this.togglePercussionTypeMenu = this.togglePercussionTypeMenu.bind(this);
    this.setPercussionType = this.setPercussionType.bind(this);
    this.handleDocumentMouseDown = this.handleDocumentMouseDown.bind(this);
    this.handleDocumentKeyDown = this.handleDocumentKeyDown.bind(this);
  }

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

    document.addEventListener('mousedown', this.handleDocumentMouseDown);
    document.addEventListener('keydown', this.handleDocumentKeyDown);
  }

  componentDidUpdate(
    _prevProps: KitChannelListComponentProps,
    prevState: KitChannelListComponentState,
  ) {
    if (this.state.editingChannelId !== prevState.editingChannelId && this.nameInput) {
      this.nameInput.focus();
      this.nameInput.select();
    }
  }

  componentWillUnmount() {
    if (this.sortable) {
      this.sortable.destroy();
    }

    document.removeEventListener('mousedown', this.handleDocumentMouseDown);
    document.removeEventListener('keydown', this.handleDocumentKeyDown);
  }

  startEditingChannelName(channel: KitChannelListChannel) {
    this.setState({
      editingChannelId: getKitChannelId(channel),
      channelNameDraft: channel.name || channel.id,
      percussionMenuChannelId: null,
    });
  }

  setChannelNameDraft(event: React.ChangeEvent<HTMLInputElement>) {
    this.setState({
      channelNameDraft: event.target.value,
    });
  }

  commitChannelName(channel: KitChannelListChannel) {
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

  handleChannelNameKeyDown(
    channel: KitChannelListChannel,
    event: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (event.key === 'Enter') {
      this.commitChannelName(channel);
    }

    if (event.key === 'Escape') {
      this.cancelChannelNameEdit();
    }
  }

  handleDocumentMouseDown(event: MouseEvent) {
    const target = event.target instanceof Element ? event.target : null;
    const isPercussionMenuClick = target?.closest('.wds-percussion-type-menu');
    const isPercussionButtonClick = target?.closest('.wds-percussion-type-button');

    if (!isPercussionMenuClick && !isPercussionButtonClick) {
      this.setState({
        percussionMenuChannelId: null,
      });
    }
  }

  handleDocumentKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.setState({
        percussionMenuChannelId: null,
      });
    }
  }

  togglePercussionTypeMenu(channel: KitChannelListChannel) {
    const channelId = getKitChannelId(channel);
    this.setState(prevState => ({
      percussionMenuChannelId: prevState.percussionMenuChannelId === channelId
        ? null
        : channelId,
    }));
  }

  setPercussionType(channel: KitChannelListChannel, percussionType: string) {
    const { onSetPercussionType } = this.props;

    onSetPercussionType(channel, percussionType);
    this.setState({
      percussionMenuChannelId: null,
    });
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
    const {
      editingChannelId,
      channelNameDraft,
      percussionMenuChannelId,
    } = this.state;

    return (
      <KitChannelListBox ref={(el) => { this.channelContainer = el; }}>
        {channels.map((channel) => {
          const channelId = getKitChannelId(channel);
          const isEditingName = editingChannelId === channelId;
          const isPercussionMenuOpen = percussionMenuChannelId === channelId;
          const percussionTypeLabel = getPercussionTypeLabel(channel.percussionType);
          const percussionTypeAbbreviation = getPercussionTypeAbbreviation(channel.percussionType);

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
                <ChannelNameGroup>
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
                  <PercussionTypeButton
                    className="wds-percussion-type-button"
                    aria-expanded={isPercussionMenuOpen}
                    aria-haspopup="menu"
                    aria-label={`Percussion type: ${percussionTypeLabel}`}
                    onClick={() => this.togglePercussionTypeMenu(channel)}
                    title={`Percussion type: ${percussionTypeLabel}`}
                    type="button"
                  >
                    {percussionTypeAbbreviation}
                  </PercussionTypeButton>
                  {isPercussionMenuOpen && (
                    <PercussionTypeMenu
                      className="wds-percussion-type-menu"
                      aria-label="Select percussion type"
                      role="menu"
                    >
                      {PERCUSSION_TYPE_OPTIONS.map(option => {
                        const isSelected = option.type === channel.percussionType;

                        return (
                          <PercussionTypeOption
                            key={option.type}
                            $selected={isSelected}
                            aria-checked={isSelected}
                            onClick={() => this.setPercussionType(channel, option.type)}
                            role="menuitemradio"
                            type="button"
                          >
                            <PercussionTypeOptionAbbreviation $selected={isSelected}>
                              {option.abbreviation}
                            </PercussionTypeOptionAbbreviation>
                            <PercussionTypeOptionLabel>{option.label}</PercussionTypeOptionLabel>
                          </PercussionTypeOption>
                        );
                      })}
                    </PercussionTypeMenu>
                  )}
                </ChannelNameGroup>
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
