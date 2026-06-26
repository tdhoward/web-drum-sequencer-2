import { createGlobalStyle } from 'styled-components';
import jostMediumWoff2 from '../assets/fonts/jost-medium-webfont.woff2';
import jostMediumWoff from '../assets/fonts/jost-medium-webfont.woff';
import jostBoldWoff2 from '../assets/fonts/jost-bold-webfont.woff2';
import jostBoldWoff from '../assets/fonts/jost-bold-webfont.woff';
import jostSemiboldWoff2 from '../assets/fonts/jost-semi-webfont.woff2';
import jostSemiboldWoff from '../assets/fonts/jost-semi-webfont.woff';

export const GlobalStyles = createGlobalStyle`
  @font-face {
    font-family: 'Jost';
    font-style: normal;
    font-weight: 400;
    src: local('Jost Medium'), local('Jost-Medium'),
        url(${jostMediumWoff2}) format('woff2'),
        url(${jostMediumWoff}) format('woff');
  }

  @font-face {
    font-family: 'Jost';
    font-style: normal;
    font-weight: 600;
    src: local('Jost SemiBold'), local('Jost-SemiBold'),
        url(${jostSemiboldWoff2}) format('woff2'),
        url(${jostSemiboldWoff}) format('woff');
  }

  @font-face {
    font-family: 'Josts';
    font-style: normal;
    font-weight: 700;
    src: local('Jost Bold'), local('Jost-Bold'),
        url(${jostBoldWoff2}) format('woff2'),
        url(${jostBoldWoff}) format('woff');
  }

  html {
    background-color: ${({ theme }) => theme.colors.surfaceApp};
  }

  * {
    font-family: "Jost", "Futura", sans-serif;
    font-display: swap;
  }

  body {
    min-width: 750px;
    box-sizing: border-box;
  }

  .bpm-text-input {
    -moz-appearance:textfield;
  }

  .bpm-text-input::-webkit-inner-spin-button,
  .bpm-text-input::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
`;

export default GlobalStyles;
