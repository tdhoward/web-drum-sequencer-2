import React from 'react';

export const compose = (...hocs) => Component => hocs.reduceRight(
  (WrappedComponent, hoc) => hoc(WrappedComponent),
  Component,
);

export const withProps = propsOrFactory => Component => function WithProps(props) {
  const nextProps = typeof propsOrFactory === 'function'
    ? propsOrFactory(props)
    : propsOrFactory;

  return React.createElement(Component, {
    ...props,
    ...nextProps,
  });
};

export const withHandlers = handlers => Component => class WithHandlers extends React.Component {
  constructor(props) {
    super(props);

    this.handlers = Object.keys(handlers).reduce((result, name) => ({
      ...result,
      [name]: (...args) => handlers[name](this.props)(...args),
    }), {});
  }

  render() {
    return React.createElement(Component, {
      ...this.props,
      ...this.handlers,
    });
  }
};

export const withState = (stateName, updaterName, initialState) => Component => class WithState extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      value: typeof initialState === 'function' ? initialState(props) : initialState,
    };

    this.update = (valueOrUpdater, callback) => {
      this.setState(
        ({ value }) => ({
          value: typeof valueOrUpdater === 'function'
            ? valueOrUpdater(value)
            : valueOrUpdater,
        }),
        callback,
      );
    };
  }

  render() {
    return React.createElement(Component, {
      ...this.props,
      [stateName]: this.state.value,
      [updaterName]: this.update,
    });
  }
};
