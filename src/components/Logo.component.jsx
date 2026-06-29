import React from 'react';
import PropTypes from 'prop-types';
import { useTheme } from 'styled-components';
import WdsLogo from '../assets/images/wds-logo.svg?react';

export const Logo = ({ color, width }) => {
  const theme = useTheme();

  return (
    <WdsLogo
      aria-label="WDS-2"
      role="img"
      width={width}
      style={{
        color,
        '--wds-logo-cutout-color': theme.colors.surfaceApp,
      }}
    />
  );
};

Logo.propTypes = {
  width: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
};
