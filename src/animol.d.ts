declare module 'animol' {
  type CssAnimationState = Record<string, unknown>;

  export const Easing: Record<string, unknown>;

  export const css: (
    element: HTMLElement,
    duration: number,
    from: CssAnimationState,
    to: CssAnimationState,
    easing?: unknown,
  ) => {
    promise: Promise<void>;
  };
}
