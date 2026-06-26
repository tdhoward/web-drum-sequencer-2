import { connect } from 'react-redux';
import { selectedThemeIdSelector, setSelectedThemeId } from '../../common';
import { ThemeSelectorComponent } from './ThemeSelector.component';

const mapStateToProps = state => ({
  selectedThemeId: selectedThemeIdSelector(state),
});

const mapDispatchToProps = {
  setSelectedThemeId,
};

export const ThemeSelector = connect(
  mapStateToProps,
  mapDispatchToProps,
)(ThemeSelectorComponent);
