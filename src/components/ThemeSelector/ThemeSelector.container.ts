import { connect } from 'react-redux';
import { selectedThemeIdSelector, setSelectedThemeId } from '../../common';
import { ThemeSelectorComponent } from './ThemeSelector.component';
import type { RootState } from '../../reducer';

const mapStateToProps = (state: RootState) => ({
  selectedThemeId: selectedThemeIdSelector(state),
});

const mapDispatchToProps = {
  setSelectedThemeId,
};

export const ThemeSelector = connect(
  mapStateToProps,
  mapDispatchToProps,
)(ThemeSelectorComponent);
