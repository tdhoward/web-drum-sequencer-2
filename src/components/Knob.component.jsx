import React from 'react';
import PropTypes from 'prop-types';
import { ThemeContext } from 'styled-components';
import defaultKnobSkinImage from '../assets/images/knob_skins/default.png';
import goldenKnobSkinImage from '../assets/images/knob_skins/golden.png';
import lightKnobSkinImage from '../assets/images/knob_skins/light.png';

const knobSkins = {
  default: {
    src: defaultKnobSkinImage,
    sprites: 50,
  },
  golden: {
    src: goldenKnobSkinImage,
    sprites: 50,
  },
  light: {
    src: lightKnobSkinImage,
    sprites: 50,
  },
};

export class Knob extends React.Component {
  static contextType = ThemeContext;

  componentDidMount() {
    const { onChange } = this.props;
    this.knob.addEventListener('input', onChange);
  }

  componentDidUpdate() {
    const { value } = this.props;
    this.knob.setValue(value);
  }

  render() {
    const { size, value, ...rest } = this.props;
    const theme = this.context || {};
    const knobTheme = theme.knob || {};
    const skin = knobSkins[knobTheme.skin] || knobSkins.default;
    return (
      <webaudio-knob
        ref={(element) => { this.knob = element; }}
        src={skin.src}
        sprites={skin.sprites || knobTheme.sprites || 50}
        min="0"
        max="100"
        width={size}
        height={size}
        value={value}
        {...rest}
      />
    );
  }
}

Knob.propTypes = {
  onChange: PropTypes.func.isRequired,
  size: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};
