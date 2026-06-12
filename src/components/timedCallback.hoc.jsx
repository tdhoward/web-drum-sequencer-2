import React from 'react';

export const timedCallback = (callback, delay) => (WrappedEl) => {
  class TimedCallback extends React.Component {
    constructor() {
      super();
      this.timer = setTimeout(callback, delay);
    }

    componentWillUnmount() {
      clearTimeout(this.timer);
    }

    render() {
      return <WrappedEl {...this.props} />;
    }
  }

  TimedCallback.displayName = WrappedEl
    ? `TimedCallback(${WrappedEl.displayName || WrappedEl.name || 'Component'})`
    : 'TimedCallback';

  return TimedCallback;
};