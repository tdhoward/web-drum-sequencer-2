export const createSelectStyles = theme => ({
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
  option: styles => ({
    ...styles,
    padding: '0.4em 1em',
  }),
});
