import React from 'react';
import { Box } from '../design-system';
import { Toggle } from './Toggle.component';
import { ToggleGroup } from './ToggleGroup.component';
import { DEFAULT_NOTE_VELOCITY } from '../../common/sequencerModel';

type ToggleNote = {
  id?: string;
  beat: number;
  velocity?: number;
};

type TogglesComponentProps = {
  notes: ToggleNote[];
  channelId: string;
  toggleNote: (channelId: string, pattern: number, beat: number) => void;
  setNoteVelocityAtBeat: (
    channelId: string,
    pattern: number,
    beat: number,
    velocity: number,
  ) => void;
  bpm: number;
  playing: boolean;
  pattern: number;
  quarterBeatsPerStep: number;
  stepsPerBeat: number;
  totalSteps: number;
};

type TogglesComponentState = {
  velocityEditorBeat: number | null;
};

type OpenVelocityEditorOptions = {
  createIfMissing: boolean;
};

const findNote = (notes: ToggleNote[], beat: number): ToggleNote | undefined => (
  notes.find(note => note.beat === beat)
);

const splitEvery = <TItem,>(size: number, items: TItem[]): TItem[][] => (
  items.reduce<TItem[][]>((groups, item, index) => {
    if (index % size === 0) {
      groups.push([]);
    }
    groups[groups.length - 1].push(item);
    return groups;
  }, [])
);

export class TogglesComponent extends React.PureComponent<
  TogglesComponentProps,
  TogglesComponentState
> {
  state: TogglesComponentState = {
    velocityEditorBeat: null,
  };

  private rootRef = React.createRef<HTMLDivElement>();

  componentDidMount() {
    document.addEventListener('pointerdown', this.handleDocumentPointerDown);
    document.addEventListener('keydown', this.handleDocumentKeyDown);
  }

  componentWillUnmount() {
    document.removeEventListener('pointerdown', this.handleDocumentPointerDown);
    document.removeEventListener('keydown', this.handleDocumentKeyDown);
  }

  private closeVelocityEditor = (): void => {
    if (this.state.velocityEditorBeat !== null) {
      this.setState({ velocityEditorBeat: null });
    }
  };

  private handleDocumentPointerDown = (event: PointerEvent): void => {
    const root = this.rootRef.current;

    if (
      this.state.velocityEditorBeat === null
      || !root
      || !event.target
      || root.contains(event.target as Node)
    ) {
      return;
    }

    this.closeVelocityEditor();
  };

  private handleDocumentKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      this.closeVelocityEditor();
    }
  };

  private handleToggleNote = (beat: number): void => {
    const {
      channelId,
      pattern,
      toggleNote,
    } = this.props;

    this.closeVelocityEditor();
    toggleNote(channelId, pattern, beat);
  };

  private handleOpenVelocityEditor = (
    beat: number,
    { createIfMissing }: OpenVelocityEditorOptions,
  ): void => {
    const {
      channelId,
      notes,
      pattern,
      setNoteVelocityAtBeat,
    } = this.props;
    const note = findNote(notes, beat);

    if (createIfMissing && !note) {
      setNoteVelocityAtBeat(channelId, pattern, beat, DEFAULT_NOTE_VELOCITY);
    }

    this.setState({ velocityEditorBeat: beat });
  };

  private handleChangeVelocity = (beat: number, velocity: number): void => {
    const {
      channelId,
      pattern,
      setNoteVelocityAtBeat,
    } = this.props;

    setNoteVelocityAtBeat(channelId, pattern, beat, velocity);
  };

  private handleResetVelocity = (beat: number): void => {
    this.handleChangeVelocity(beat, DEFAULT_NOTE_VELOCITY);
  };

  render() {
    const {
      notes,
      quarterBeatsPerStep,
      stepsPerBeat,
      totalSteps,
    } = this.props;
    const { velocityEditorBeat } = this.state;
    const stepCount = Math.max(1, Math.round(totalSteps));
    const groupSize = Math.max(1, Math.round(stepsPerBeat));
    const toggles = Array.from({ length: stepCount }, (_, index) => {
      const beat = 1 + (index * quarterBeatsPerStep);
      const note = findNote(notes, beat);
      const velocity = note?.velocity ?? DEFAULT_NOTE_VELOCITY;
      const isActive = Boolean(note);
      return (
        <Toggle
          key={index}
          isActive={isActive}
          velocity={velocity}
          isVelocityEditorOpen={velocityEditorBeat === beat}
          onClick={() => {
            this.handleToggleNote(beat);
          }}
          onOpenVelocityEditor={(options) => {
            this.handleOpenVelocityEditor(beat, options);
          }}
          onChangeVelocity={(nextVelocity) => {
            this.handleChangeVelocity(beat, nextVelocity);
          }}
          onResetVelocity={() => {
            this.handleResetVelocity(beat);
          }}
          beat={beat}
        />
      );
    });

    const toggleGroups = splitEvery(groupSize, toggles);

    return (
      <Box ref={this.rootRef} display="flex" flex="1 1 auto" alignItems="center">
        {toggleGroups.map((toggleGroup, i) => (
          <ToggleGroup key={i}>
            {toggleGroup}
          </ToggleGroup>
        ))}
      </Box>
    );
  }
}
