import { connect } from 'react-redux';
import { songSelector } from '../../common';
import { PresetSelectorComponent } from '../PresetSelector/PresetSelector.component';
import type { RootState } from '../../reducer';
import type { SongState } from '../../common/sequencerModel';

const SongPresetSelectorComponent = PresetSelectorComponent<SongState, never>;

const mapStateToProps = (state: RootState) => {
  const song = songSelector(state);

  return {
    ariaLabel: 'Select Song Preset',
    currentPreset: song,
    label: 'SONG PRESET',
    onSelectPreset: () => undefined,
    presets: [song],
    showUserGroup: false,
  };
};

export const SongPresetSelector = connect(
  mapStateToProps,
)(SongPresetSelectorComponent);
