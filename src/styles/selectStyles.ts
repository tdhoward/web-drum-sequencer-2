import type { StylesConfig } from 'react-select';
import type { AppTheme } from './theme';

type SelectStyleOptions = {
  menuFontSize?: string;
  menuWidth?: string;
  optionPadding?: string;
};

export const createSelectStyles = <
  Option = unknown,
  IsMulti extends boolean = false,
>(
  theme: AppTheme,
  {
    menuFontSize,
    menuWidth,
    optionPadding = '0.4em 1em',
  }: SelectStyleOptions = {},
): StylesConfig<Option, IsMulti> => ({
  container: styles => ({
    ...styles,
    height: '100%',
  }),
  control: styles => ({
    ...styles,
    backgroundColor: theme.colors.surfaceControl,
    border: `2px solid ${theme.colors.borderDefault}`,
    height: '100%',
    borderRadius: '0.5em',
  }),
  singleValue: styles => ({
    ...styles,
    color: theme.colors.textPrimary,
  }),
  input: styles => ({
    ...styles,
    color: theme.colors.textPrimary,
  }),
  placeholder: styles => ({
    ...styles,
    color: String(theme.colors.textMuted),
  }),
  menu: styles => ({
    ...styles,
    backgroundColor: theme.colors.surfaceControl,
    border: `2px solid ${theme.colors.borderDefault}`,
    color: theme.colors.textPrimary,
    fontSize: menuFontSize,
    overflow: 'hidden',
    width: menuWidth,
  }),
  menuList: styles => ({
    ...styles,
    backgroundColor: theme.colors.surfaceControl,
  }),
  groupHeading: styles => ({
    ...styles,
    color: String(theme.colors.textMuted),
  }),
  option: (styles, {
    isDisabled,
    isFocused,
    isSelected,
  }) => ({
    ...styles,
    backgroundColor: isSelected
      ? String(theme.colors.accentPrimary)
      : isFocused
        ? String(theme.colors.surfaceControlHover)
        : theme.colors.surfaceControl,
    color: isDisabled
      ? String(theme.colors.textMuted)
      : isSelected
        ? String(theme.colors.textInverse)
        : theme.colors.textPrimary,
    cursor: isDisabled ? 'default' : 'pointer',
    padding: optionPadding,
    ':active': {
      ...styles[':active'],
      backgroundColor: isSelected
        ? String(theme.colors.accentPrimaryActive)
        : String(theme.colors.surfaceControlHover),
    },
  }),
  noOptionsMessage: styles => ({
    ...styles,
    color: String(theme.colors.textMuted),
  }),
});
