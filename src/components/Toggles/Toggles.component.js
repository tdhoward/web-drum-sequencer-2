import React from 'react';
import * as R from 'ramda';
import PropTypes from 'prop-types';
import { Toggle } from './Toggle.component';

const sixteenthNotes = R.range(0, 16);

const isActive = (notes, beat) => notes.find(note => note.beat === beat) !== undefined;

const highlight = (beat, currentBeat) => {
  if (currentBeat > beat && currentBeat < beat + 0.25) {
    return true;
  }
  return false;
};

export const TogglesComponent = ({
  notes,
  channelID,
  toggleNote,
  currentBeat,
}) => (
  <div className="flex flex-auto">
    {sixteenthNotes.map((index) => {
      const beat = 1 + index / 4;
      return (
        <Toggle
          key={index}
          isActive={isActive(notes, beat)}
          onClick={() => { toggleNote(channelID, beat); }}
          highlight={highlight(beat, currentBeat)}
        />
      );
    })}
  </div>
);

TogglesComponent.propTypes = {
  notes: PropTypes.arrayOf(PropTypes.object).isRequired,
  channelID: PropTypes.string.isRequired,
  toggleNote: PropTypes.func.isRequired,
  currentBeat: PropTypes.number.isRequired,
};