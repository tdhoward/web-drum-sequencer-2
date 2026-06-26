const classicDarkPalette = {
  nearWhite: '#F2F2F8',
  lightGray: '#C0C3C7',
  gray: '#909599',
  steel: '#606469',
  darkGray: '#404449',
  nearBlack: '#202427',
  black80: 'rgba(0,0,0,0.8)',
  green: '#58A291',
  lightGreen: '#68B2A1',
  darkGreen: '#1B806D',
  red: '#CD545B',
  lightRed: '#DD646B',
  darkRed: '#633231',
  brightRed: 'rgb(244, 83, 58)',
  brightRed30: 'rgba(244, 83, 58, 0.3)',
  gold: '#E6A65D',
  yellow: 'rgb(255, 224, 71)',
  yellow30: 'rgba(255, 224, 71, 0.3)',
  primary: 'rgba(213,255,169,1)',
  primaryDark: 'rgba(180,215,129,1)',
  secondary: 'rgba(152,255,193,1)',
  blue: '#2f85c6',
  darkBlue: '#196096',
};

const createTheme = ({
  id,
  name,
  colors,
}) => ({
  id,
  name,
  fontSizes: [
    11, 13, 14, 24, 32, 48, 64, 96, 128,
  ],
  space: [
    // margin and padding
    0, 4, 8, 16, 32, 64, 128, 256,
  ],
  breakpoints: ['640px', '720px', '769px', '820px', '900px', '1024px', '1200px', '1400px'],
  colors,
  fancyButtons: {
    green: {
      color: 'white',
      backgroundColor: colors.green,
      boxShadow: `0 0.3em ${colors.darkGreen}`,
      '&:hover': {
        backgroundColor: colors.lightGreen,
      },
      '&:active': {
        backgroundColor: colors.lightGreen,
        boxShadow: `0 0 ${colors.darkGreen}`,
        transform: 'translateY(0.3em)',
      },
    },
    red: {
      color: 'white',
      backgroundColor: colors.red,
      boxShadow: `0 0.3em ${colors.darkRed}`,
      '&:hover': {
        backgroundColor: colors.lightRed,
      },
      '&:active': {
        backgroundColor: colors.lightRed,
        boxShadow: `0 0 ${colors.darkRed}`,
        transform: 'translateY(0.3em)',
      },
    },
  },
});

const classicDarkColors = {
  ...classicDarkPalette,

  surfaceApp: classicDarkPalette.nearBlack,
  surfacePanel: classicDarkPalette.nearBlack,
  surfacePanelRaised: classicDarkPalette.darkGray,
  surfaceControl: 'black',
  surfaceControlHover: classicDarkPalette.steel,
  surfaceOverlay: classicDarkPalette.black80,
  surfaceInverse: 'white',

  borderDefault: classicDarkPalette.steel,
  borderHover: classicDarkPalette.gray,
  borderSubtle: 'rgba(255, 255, 255, 0.06)',

  textPrimary: classicDarkPalette.nearWhite,
  textSecondary: classicDarkPalette.lightGray,
  textMuted: classicDarkPalette.gray,
  textInverse: classicDarkPalette.nearBlack,

  accentPrimary: classicDarkPalette.secondary,
  accentPrimaryActive: classicDarkPalette.primaryDark,
  accentPrimaryGlow: 'rgba(152, 255, 193, 0.42)',

  actionPrimary: classicDarkPalette.blue,
  actionPrimaryHover: classicDarkPalette.darkBlue,

  errorBorder: classicDarkPalette.lightRed,
  danger: classicDarkPalette.brightRed,
  dangerSubtle: classicDarkPalette.brightRed30,
  warning: classicDarkPalette.yellow,
  warningSubtle: classicDarkPalette.yellow30,
  waveform: classicDarkPalette.secondary,
  waveformGuide: 'rgba(152, 255, 193, 0.08)',
};

const highContrastDarkPalette = {
  ...classicDarkPalette,
  nearWhite: '#FFFFFF',
  lightGray: '#D8DEE9',
  gray: '#A7B1BC',
  steel: '#8A97A8',
  darkGray: '#1F2933',
  nearBlack: '#0B1014',
  green: '#39BFA7',
  lightGreen: '#72E0D1',
  darkGreen: '#0D665B',
  red: '#E85F6A',
  lightRed: '#FF7A85',
  darkRed: '#7A2B34',
  gold: '#F6C85F',
  primary: '#F6C85F',
  primaryDark: '#FFE08A',
  secondary: '#72E0D1',
  blue: '#4AA8FF',
  darkBlue: '#1F6FB8',
};

const highContrastDarkColors = {
  ...highContrastDarkPalette,

  surfaceApp: highContrastDarkPalette.nearBlack,
  surfacePanel: '#101820',
  surfacePanelRaised: highContrastDarkPalette.darkGray,
  surfaceControl: '#020609',
  surfaceControlHover: highContrastDarkPalette.steel,
  surfaceOverlay: 'rgba(0, 0, 0, 0.86)',
  surfaceInverse: '#FFFFFF',

  borderDefault: highContrastDarkPalette.steel,
  borderHover: highContrastDarkPalette.lightGray,
  borderSubtle: 'rgba(255, 255, 255, 0.14)',

  textPrimary: highContrastDarkPalette.nearWhite,
  textSecondary: highContrastDarkPalette.lightGray,
  textMuted: highContrastDarkPalette.gray,
  textInverse: highContrastDarkPalette.nearBlack,

  accentPrimary: highContrastDarkPalette.gold,
  accentPrimaryActive: highContrastDarkPalette.primaryDark,
  accentPrimaryGlow: 'rgba(246, 200, 95, 0.48)',

  actionPrimary: highContrastDarkPalette.blue,
  actionPrimaryHover: highContrastDarkPalette.darkBlue,

  errorBorder: highContrastDarkPalette.lightRed,
  danger: highContrastDarkPalette.brightRed,
  dangerSubtle: highContrastDarkPalette.brightRed30,
  warning: highContrastDarkPalette.yellow,
  warningSubtle: highContrastDarkPalette.yellow30,
  waveform: highContrastDarkPalette.gold,
  waveformGuide: 'rgba(246, 200, 95, 0.16)',
};

export const classicDarkTheme = createTheme({
  id: 'classicDark',
  name: 'Classic Dark',
  colors: classicDarkColors,
});

export const highContrastDarkTheme = createTheme({
  id: 'highContrastDark',
  name: 'High Contrast Dark',
  colors: highContrastDarkColors,
});

export const DEFAULT_THEME_ID = classicDarkTheme.id;

export const colorThemes = {
  [classicDarkTheme.id]: classicDarkTheme,
  [highContrastDarkTheme.id]: highContrastDarkTheme,
};

export default classicDarkTheme;
