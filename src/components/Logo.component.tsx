import React from 'react';
import { useTheme } from 'styled-components';
import WdsLogo from '../assets/images/wds-logo.svg?react';

type LogoProps = {
  color: string | number;
  width: string;
};

type LogoStyle = React.CSSProperties & {
  '--wds-logo-cutout-color': string | number;
};

export const Logo = ({ color, width }: LogoProps) => {
  const theme = useTheme();
  const style: LogoStyle = {
    color: String(color),
    '--wds-logo-cutout-color': theme.colors.surfaceApp,
  };

  return (
    <WdsLogo
      aria-label="WDS-2"
      role="img"
      width={width}
      style={style}
    />
  );
};
