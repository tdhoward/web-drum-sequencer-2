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
    this.syncKnob();
  }

  componentDidUpdate(prevProps) {
    const { onChange } = this.props;

    if (prevProps.onChange !== onChange) {
      this.knob.removeEventListener('input', prevProps.onChange);
      this.knob.addEventListener('input', onChange);
    }

    this.syncKnob();
  }

  componentWillUnmount() {
    const { onChange } = this.props;

    if (this.knob) {
      this.knob.removeEventListener('input', onChange);
    }
  }

  getKnobElementProps() {
    const { size, value, ...rest } = this.props;
    const theme = this.context || {};
    const knobTheme = theme.knob || {};
    const skin = knobSkins[knobTheme.skin] || knobSkins.default;

    return {
      src: skin.src,
      sprites: skin.sprites || knobTheme.sprites || 50,
      min: '0',
      max: '100',
      step: '1',
      width: size,
      height: size,
      value,
      ...rest,
    };
  }

  syncKnob() {
    if (!this.knob) {
      return;
    }

    const {
      src,
      sprites,
      min,
      max,
      step,
      width,
      height,
      value,
    } = this.getKnobElementProps();

    [
      ['src', src],
      ['sprites', sprites],
      ['min', min],
      ['max', max],
      ['step', step],
      ['width', width],
      ['height', height],
      ['value', value],
    ].forEach(([name, nextValue]) => {
      if (nextValue === undefined) {
        this.knob.removeAttribute(name);
      } else {
        this.knob.setAttribute(name, nextValue);
      }
    });

    this.knob.src = src;
    this.knob.sprites = sprites;
    this.knob.min = min;
    this.knob.max = max;
    this.knob.step = step;
    this.knob.width = width;
    this.knob.height = height;
    this.knob.setValue(value);
  }

  render() {
    const knobProps = this.getKnobElementProps();

    return (
      <webaudio-knob
        ref={(element) => { this.knob = element; }}
        {...knobProps}
      />
    );
  }
}

Knob.propTypes = {
  onChange: PropTypes.func.isRequired,
  size: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};
