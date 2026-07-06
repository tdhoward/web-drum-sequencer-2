import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { selectedKitSelector } from '../../common/kits';
import { CurrentKitDisplayComponent } from './CurrentKitDisplay.component';
import type { RootState } from '../../reducer';

const currentPresetNameSelector = (state: RootState): string | undefined => state.presets?.preset;

const currentKitDisplayNameSelector = createSelector(
  [selectedKitSelector, currentPresetNameSelector],
  (selectedKit, currentPresetName) => {
    if (!selectedKit) {
      return currentPresetName || 'No kit selected';
    }

    if (selectedKit.name === 'Default Kit' && currentPresetName) {
      return currentPresetName;
    }

    return selectedKit.name;
  },
);

const mapStateToProps = (state: RootState) => ({
  kitName: currentKitDisplayNameSelector(state),
});

export const CurrentKitDisplay = connect(mapStateToProps)(CurrentKitDisplayComponent);
