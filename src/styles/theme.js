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
  knob = {
    skin: 'default',
    sprites: 50,
  },
}) => ({
  id,
  name,
  knob,
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

  channelHeaderBackground: 'black',
  channelHeaderMarkerBackground: classicDarkPalette.darkGray,
  channelHeaderText: 'white',

  sequencerGroupBackground: 'black',
  sequencerBeatInactiveBackground: classicDarkPalette.darkGray,

  patternSelectorBackground: classicDarkPalette.lightGray,
  patternSelectorText: 'rgba(0, 0, 0, 0.5)',
  patternSelectorSelectedBackground: classicDarkPalette.secondary,
  patternSelectorSelectedText: 'rgba(0, 0, 0, 0.5)',
  patternSelectorActiveBackground: classicDarkPalette.primaryDark,

  bpmControlBackground: 'linear-gradient(190deg, #19191D 0%, #303036 50%, #0a0e0a 51%, #29292D 100%)',
  bpmControlText: classicDarkPalette.secondary,
  bpmControlButtonText: classicDarkPalette.nearWhite,
  bpmControlButtonActiveBackground: 'rgba(255, 255, 255, 0.2)',

  knobLabelText: classicDarkPalette.nearWhite,
  knobScaleText: classicDarkPalette.lightGray,
  hitButtonBackground: classicDarkPalette.lightGray,
  hitButtonBackgroundHover: classicDarkPalette.nearWhite,
  hitButtonBackgroundActive: classicDarkPalette.gray,
  channelDragHandleFilter: 'none',
  channelDragHandleOpacity: 0.24,
  channelDragHandleHoverOpacity: 0.36,

  errorBorder: classicDarkPalette.lightRed,
  danger: classicDarkPalette.brightRed,
  dangerSubtle: classicDarkPalette.brightRed30,
  warning: classicDarkPalette.yellow,
  warningSubtle: classicDarkPalette.yellow30,
  waveform: classicDarkPalette.secondary,
  waveformGuide: 'rgba(152, 255, 193, 0.08)',
  waveformDurationBackground: 'rgba(0, 0, 0, 0.55)',
  waveformDurationBorder: 'rgba(255, 255, 255, 0.1)',
  waveformDurationText: classicDarkPalette.nearWhite,
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

  channelHeaderBackground: '#020609',
  channelHeaderMarkerBackground: highContrastDarkPalette.darkGray,
  channelHeaderText: highContrastDarkPalette.nearWhite,

  sequencerGroupBackground: '#020609',
  sequencerBeatInactiveBackground: highContrastDarkPalette.darkGray,

  patternSelectorBackground: highContrastDarkPalette.lightGray,
  patternSelectorText: highContrastDarkPalette.nearBlack,
  patternSelectorSelectedBackground: highContrastDarkPalette.gold,
  patternSelectorSelectedText: highContrastDarkPalette.nearBlack,
  patternSelectorActiveBackground: highContrastDarkPalette.primaryDark,

  bpmControlBackground: 'linear-gradient(190deg, #0B1014 0%, #1F2933 50%, #020609 51%, #101820 100%)',
  bpmControlText: highContrastDarkPalette.gold,
  bpmControlButtonText: highContrastDarkPalette.nearWhite,
  bpmControlButtonActiveBackground: 'rgba(255, 255, 255, 0.24)',

  knobLabelText: highContrastDarkPalette.nearWhite,
  knobScaleText: highContrastDarkPalette.lightGray,
  hitButtonBackground: highContrastDarkPalette.lightGray,
  hitButtonBackgroundHover: highContrastDarkPalette.nearWhite,
  hitButtonBackgroundActive: highContrastDarkPalette.gray,
  channelDragHandleFilter: 'none',
  channelDragHandleOpacity: 0.36,
  channelDragHandleHoverOpacity: 0.52,

  errorBorder: highContrastDarkPalette.lightRed,
  danger: highContrastDarkPalette.brightRed,
  dangerSubtle: highContrastDarkPalette.brightRed30,
  warning: highContrastDarkPalette.yellow,
  warningSubtle: highContrastDarkPalette.yellow30,
  waveform: highContrastDarkPalette.gold,
  waveformGuide: 'rgba(246, 200, 95, 0.16)',
  waveformDurationBackground: 'rgba(0, 0, 0, 0.68)',
  waveformDurationBorder: 'rgba(255, 255, 255, 0.2)',
  waveformDurationText: highContrastDarkPalette.nearWhite,
};

const lightStudioPalette = {
  nearWhite: '#17202A',
  lightGray: '#52606D',
  gray: '#6F7D8C',
  steel: '#9EADB9',
  darkGray: '#E5EAF0',
  nearBlack: '#F3F6F9',
  black80: 'rgba(19, 28, 36, 0.7)',
  green: '#1E927D',
  lightGreen: '#32AD96',
  darkGreen: '#0E6E5D',
  red: '#C94450',
  lightRed: '#E55B67',
  darkRed: '#8F2E37',
  brightRed: '#D63C4A',
  brightRed30: 'rgba(214, 60, 74, 0.22)',
  gold: '#B87A21',
  yellow: '#D59A1F',
  yellow30: 'rgba(213, 154, 31, 0.26)',
  primary: '#127E74',
  primaryDark: '#0B675E',
  secondary: '#1172B8',
  blue: '#236FB4',
  darkBlue: '#174D81',
};

const lightStudioColors = {
  ...lightStudioPalette,

  surfaceApp: lightStudioPalette.nearBlack,
  surfacePanel: '#FFFFFF',
  surfacePanelRaised: lightStudioPalette.darkGray,
  surfaceControl: '#FFFFFF',
  surfaceControlHover: '#D7E0E8',
  surfaceOverlay: lightStudioPalette.black80,
  surfaceInverse: '#FFFFFF',

  borderDefault: lightStudioPalette.steel,
  borderHover: lightStudioPalette.gray,
  borderSubtle: 'rgba(23, 32, 42, 0.12)',

  textPrimary: lightStudioPalette.nearWhite,
  textSecondary: lightStudioPalette.lightGray,
  textMuted: lightStudioPalette.gray,
  textInverse: '#FFFFFF',

  accentPrimary: lightStudioPalette.secondary,
  accentPrimaryActive: lightStudioPalette.darkBlue,
  accentPrimaryGlow: 'rgba(17, 114, 184, 0.28)',

  actionPrimary: lightStudioPalette.blue,
  actionPrimaryHover: lightStudioPalette.darkBlue,

  channelHeaderBackground: '#CAD3DC',
  channelHeaderMarkerBackground: '#B8C3CD',
  channelHeaderText: '#3B4650',

  sequencerGroupBackground: '#D7E0E8',
  sequencerBeatInactiveBackground: 'rgb(245, 250, 255)',

  patternSelectorBackground: '#B8C3CD',
  patternSelectorText: '#3B4650',
  patternSelectorSelectedBackground: lightStudioPalette.secondary,
  patternSelectorSelectedText: '#FFFFFF',
  patternSelectorActiveBackground: lightStudioPalette.darkBlue,

  bpmControlBackground: 'linear-gradient(190deg, #F7FAFC 0%, #E9EFF4 50%, #D8E1E9 51%, #EEF3F7 100%)',
  bpmControlText: lightStudioPalette.nearWhite,
  bpmControlButtonText: lightStudioPalette.lightGray,
  bpmControlButtonActiveBackground: 'rgba(23, 32, 42, 0.12)',

  knobLabelText: lightStudioPalette.lightGray,
  knobScaleText: lightStudioPalette.gray,
  hitButtonBackground: '#C6D1DB',
  hitButtonBackgroundHover: '#D5DEE6',
  hitButtonBackgroundActive: lightStudioPalette.steel,
  channelDragHandleFilter: 'brightness(0) saturate(100%) invert(48%)',
  channelDragHandleOpacity: 0.44,
  channelDragHandleHoverOpacity: 0.62,

  errorBorder: lightStudioPalette.lightRed,
  danger: lightStudioPalette.brightRed,
  dangerSubtle: lightStudioPalette.brightRed30,
  warning: lightStudioPalette.yellow,
  warningSubtle: lightStudioPalette.yellow30,
  waveform: lightStudioPalette.secondary,
  waveformGuide: 'rgba(17, 114, 184, 0.1)',
  waveformDurationBackground: 'rgba(255, 255, 255, 0.82)',
  waveformDurationBorder: 'rgba(23, 32, 42, 0.12)',
  waveformDurationText: lightStudioPalette.lightGray,

  brandLogo: lightStudioPalette.nearWhite,
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
  knob: {
    skin: 'golden',
    sprites: 50,
  },
});

export const lightStudioTheme = createTheme({
  id: 'lightStudio',
  name: 'Light Studio',
  colors: lightStudioColors,
  knob: {
    skin: 'light',
    sprites: 50,
  },
});

export const DEFAULT_THEME_ID = classicDarkTheme.id;

export const colorThemes = {
  [classicDarkTheme.id]: classicDarkTheme,
  [highContrastDarkTheme.id]: highContrastDarkTheme,
  [lightStudioTheme.id]: lightStudioTheme,
};

export default classicDarkTheme;
