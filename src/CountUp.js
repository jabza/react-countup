import PropTypes from 'prop-types';
import React, { Component } from 'react';
import warning from 'warning';
import { createCountUpInstance } from './common';

class CountUp extends Component {
  static propTypes = {
    decimal: PropTypes.string,
    decimals: PropTypes.number,
    delay: PropTypes.number,
    easingFn: PropTypes.func,
    end: PropTypes.number.isRequired,
    formattingFn: PropTypes.func,
    onEnd: PropTypes.func,
    onStart: PropTypes.func,
    prefix: PropTypes.string,
    redraw: PropTypes.bool,
    separator: PropTypes.string,
    start: PropTypes.number,
    startOnMount: PropTypes.bool,
    suffix: PropTypes.string,
    style: PropTypes.object,
    useEasing: PropTypes.bool,
    preserveValue: PropTypes.bool,
  };

  static defaultProps = {
    decimal: '.',
    decimals: 0,
    delay: null,
    duration: null,
    easingFn: null,
    formattingFn: null,
    onEnd: () => {},
    onPauseResume: () => {},
    onReset: () => {},
    onStart: () => {},
    onUpdate: () => {},
    prefix: '',
    redraw: false,
    separator: '',
    start: 0,
    startOnMount: true,
    suffix: '',
    style: undefined,
    useEasing: true,
    preserveValue: false,
  };

  componentDidMount() {
    const { children, delay } = this.props;
    this.instance = this.createInstance();

    // Don't invoke start if component is used as a render prop
    if (typeof children === 'function' && delay !== 0) return;

    // Otherwise just start immediately
    this.start();
  }

  shouldComponentUpdate(nextProps) {
    const {
      end,
      start,
      suffix,
      prefix,
      redraw,
      duration,
      separator,
      decimals,
      decimal,
    } = this.props;

    const hasCertainPropsChanged =
      duration !== nextProps.duration ||
      end !== nextProps.end ||
      start !== nextProps.start ||
      suffix !== nextProps.suffix ||
      prefix !== nextProps.prefix ||
      separator !== nextProps.separator ||
      decimals !== nextProps.decimals ||
      decimal !== nextProps.decimal;

    return hasCertainPropsChanged || redraw;
  }

  componentDidUpdate(prevProps) {
    // If duration, suffix, prefix, separator or start has changed
    // there's no way to update the values.
    // So we need to re-create the CountUp instance in order to
    // restart it.
    const {
      end,
      start,
      suffix,
      prefix,
      duration,
      separator,
      decimals,
      decimal,
      preserveValue,
    } = this.props;

    if (
      duration !== prevProps.duration ||
      start !== prevProps.start ||
      suffix !== prevProps.suffix ||
      prefix !== prevProps.prefix ||
      separator !== prevProps.separator ||
      decimals !== prevProps.decimals ||
      decimal !== prevProps.decimal
    ) {
      this.instance.reset();
      this.instance = this.createInstance();
      this.start();
    }

    // Only end value has changed, so reset and and re-animate with the updated
    // end value.
    if (end !== prevProps.end) {
      if (!preserveValue) {
        this.instance.reset();
      }
      this.instance.update(end);
    }
  }

  componentWillUnmount() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    this.instance.reset();
  }

  createInstance = () => {
    if (typeof this.props.children === 'function') {
      // Warn when user didn't use containerRef at all
      warning(
        this.containerRef.current &&
          (this.containerRef.current instanceof HTMLElement ||
            this.containerRef.current instanceof SVGTextElement ||
            this.containerRef.current instanceof SVGTSpanElement),
        `Couldn't find attached element to hook the CountUp instance into! Try to attach "containerRef" from the render prop to a an HTMLElement, eg. <span ref={containerRef} />.`,
      );
    }
    return createCountUpInstance(this.containerRef.current, this.props);
  };

  pauseResume = () => {
    const { reset, restart: start, update } = this;
    const { onPauseResume } = this.props;

    this.instance.pauseResume();

    onPauseResume({ reset, start, update });
  };

  reset = () => {
    const { pauseResume, restart: start, update } = this;
    const { onReset } = this.props;

    this.instance.reset();

    onReset({ pauseResume, start, update });
  };

  restart = () => {
    this.reset();
    this.start();
  };

  start = () => {
    const { pauseResume, reset, restart: start, update } = this;
    const { delay, onEnd, onStart } = this.props;
    const run = () =>
      this.instance.start(() => onEnd({ pauseResume, reset, start, update }));

    // Delay start if delay prop is properly set
    if (delay > 0) {
      this.timeoutId = setTimeout(run, delay * 1000);
    } else {
      run();
    }

    onStart({ pauseResume, reset, update });
  };

  update = newEnd => {
    const { pauseResume, reset, restart: start } = this;
    const { onUpdate } = this.props;

    this.instance.update(newEnd);

    onUpdate({ pauseResume, reset, start });
  };

  containerRef = React.createRef();

  render() {
    const { children, className, style } = this.props;
    const { containerRef, pauseResume, reset, restart, update } = this;

    if (typeof children === 'function') {
      return children({
        countUpRef: containerRef,
        pauseResume,
        reset,
        start: restart,
        update,
      });
    }

    return <span className={className} ref={containerRef} style={style} />;
  }
}

export default CountUp;
