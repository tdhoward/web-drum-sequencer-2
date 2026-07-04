import React from 'react';
import { Box } from '../design-system';
import { Toggle } from './Toggle.component';
import { ToggleGroup } from './ToggleGroup.component';

type ToggleNote = {
  id?: string;
  beat: number;
};

type TogglesComponentProps = {
  notes: ToggleNote[];
  channelId: string;
  toggleNote: (channelId: string, pattern: number, beat: number) => void;
  bpm: number;
  playing: boolean;
  pattern: number;
};

const isActive = (notes: ToggleNote[], beat: number): boolean => (
  notes.find(note => note.beat === beat) !== undefined
);

const sixteenthNotes = Array.from({ length: 16 }, (_, index) => index);

const splitEvery = <TItem,>(size: number, items: TItem[]): TItem[][] => (
  items.reduce<TItem[][]>((groups, item, index) => {
    if (index % size === 0) {
      groups.push([]);
    }
    groups[groups.length - 1].push(item);
    return groups;
  }, [])
);

export class TogglesComponent extends React.PureComponent<TogglesComponentProps> {
  render() {
    const {
      notes,
      channelId,
      toggleNote,
      pattern,
    } = this.props;
    const toggles = sixteenthNotes.map((index) => {
      const beat = 1 + index / 4;
      return (
        <Toggle
          key={index}
          isActive={isActive(notes, beat)}
          onClick={() => {
            toggleNote(channelId, pattern, beat);
          }}
          beat={beat}
        />
      );
    });

    const toggleGroups = splitEvery(4, toggles);

    return (
      <Box display="flex" flex="1 1 auto" alignItems="center">
        {toggleGroups.map((toggleGroup, i) => (
          <ToggleGroup key={i}>
            {toggleGroup}
          </ToggleGroup>
        ))}
      </Box>
    );
  }
}
