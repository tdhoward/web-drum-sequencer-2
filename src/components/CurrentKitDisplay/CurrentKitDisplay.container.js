import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { selectedKitSelector } from '../../common/kits';
import { CurrentKitDisplayComponent } from './CurrentKitDisplay.component';

const currentPresetNameSelector = state => state.presets?.preset;

const currentKitDisplayNameSelector = createSelector(
  selectedKitSelector,
  currentPresetNameSelector,
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

const mapStateToProps = state => ({
  kitName: currentKitDisplayNameSelector(state),
});

export const CurrentKitDisplay = connect(mapStateToProps)(CurrentKitDisplayComponent);
