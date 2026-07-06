import React from 'react';
import { ThemeContext } from 'styled-components';
import defaultKnobSkinImage from '../assets/images/knob_skins/default.png';
import goldenKnobSkinImage from '../assets/images/knob_skins/golden.png';
import lightKnobSkinImage from '../assets/images/knob_skins/light.png';
import type { AppTheme } from '../styles/theme';
import type { WebAudioControlValue, WebAudioKnobElement } from './webaudioControls';

type KnobSkin = {
  src: string;
  sprites: number;
};

type KnobSkinName = 'default' | 'golden' | 'light';

const knobSkins: Record<KnobSkinName, KnobSkin> = {
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

export type KnobProps = {
  onChange: EventListener;
  size: number;
  value: WebAudioControlValue;
  min?: WebAudioControlValue;
  max?: WebAudioControlValue;
  step?: WebAudioControlValue;
};

type KnobElementProps = Required<Pick<KnobProps, 'min' | 'max' | 'step'>> & {
  src: string;
  sprites: number;
  width: number;
  height: number;
  value: WebAudioControlValue;
};

const getKnobSkin = (skinName: string | undefined): KnobSkin => (
  knobSkins[skinName as KnobSkinName] || knobSkins.default
);

export class Knob extends React.Component<KnobProps> {
  static contextType = ThemeContext;

  declare context: AppTheme | undefined;

  knob: WebAudioKnobElement | null = null;

  componentDidMount() {
    const { onChange } = this.props;
    this.knob?.addEventListener('input', onChange);
    this.syncKnob();
  }

  componentDidUpdate(prevProps: KnobProps) {
    const { onChange } = this.props;

    if (this.knob && prevProps.onChange !== onChange) {
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

  getKnobElementProps(): KnobElementProps {
    const {
      size,
      value,
      onChange,
      min = '0',
      max = '100',
      step = '1',
    } = this.props;
    const knobTheme = this.context?.knob;
    const skin = getKnobSkin(knobTheme?.skin);
    void onChange;

    return {
      src: skin.src,
      sprites: skin.sprites || knobTheme?.sprites || 50,
      min,
      max,
      step,
      width: size,
      height: size,
      value,
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

    const knob = this.knob;
    const attributes: Array<[string, WebAudioControlValue]> = [
      ['src', src],
      ['sprites', sprites],
      ['min', min],
      ['max', max],
      ['step', step],
      ['width', width],
      ['height', height],
      ['value', value],
    ];

    attributes.forEach(([name, nextValue]) => {
      if (nextValue === undefined) {
        knob.removeAttribute(name);
      } else {
        knob.setAttribute(name, String(nextValue));
      }
    });

    knob.src = src;
    knob.sprites = sprites;
    knob.min = min;
    knob.max = max;
    knob.step = step;
    knob.width = width;
    knob.height = height;
    knob.setValue(value);
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
