import type * as React from 'react';

export type WebAudioControlValue = string | number;

export type WebAudioKnobElement = HTMLElement & {
  src: string;
  sprites: number;
  min: WebAudioControlValue;
  max: WebAudioControlValue;
  step: WebAudioControlValue;
  width: number;
  height: number;
  value: WebAudioControlValue;
  setValue: (value: WebAudioControlValue, fireEvent?: boolean) => void;
};

type WebAudioKnobAttributes = {
  src?: string;
  sprites?: number;
  min?: WebAudioControlValue;
  max?: WebAudioControlValue;
  step?: WebAudioControlValue;
  width?: number;
  height?: number;
  value?: WebAudioControlValue;
};

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'webaudio-knob': React.DetailedHTMLProps<
        React.HTMLAttributes<WebAudioKnobElement>,
        WebAudioKnobElement
      > & WebAudioKnobAttributes;
    }
  }
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'webaudio-knob': React.DetailedHTMLProps<
        React.HTMLAttributes<WebAudioKnobElement>,
        WebAudioKnobElement
      > & WebAudioKnobAttributes;
    }
  }
}
