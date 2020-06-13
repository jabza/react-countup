import { useEffect, useRef, useState } from 'react';
import CountUp from './CountUp';
import { createCountUpInstance } from './common';

// CountUp.js requires an element to execute it's animation,
// and just sets the innerHTML of the element.
const MOCK_ELEMENT = { innerHTML: null };

const useCountUp = props => {
  const _props = { ...CountUp.defaultProps, ...props };
  const { start, formattingFn } = _props;
  const [count, setCount] = useState(
    typeof formattingFn === 'function' ? formattingFn(start) : start,
  );
  const countUpRef = useRef(null);

  const createInstance = () => {
    const countUp = createCountUpInstance(MOCK_ELEMENT, _props);
    let formattingFnRef = countUp.options.formattingFn;
    countUp.options.formattingFn = (...args) => {
      const result = formattingFnRef(...args);
      setCount(result);
    };
    return countUp;
  };

  const getCountUp = () => {
    const countUp = countUpRef.current;
    if (countUp !== null) {
      return countUp;
    }
    const newCountUp = createInstance();
    countUpRef.current = newCountUp;
    return newCountUp;
  };

  const reset = () => {
    const { onReset } = _props;
    getCountUp().reset();
    onReset({ pauseResume, start: restart, updateCount });
  };

  const restart = () => {
    const { onStart, onEnd } = _props;
    getCountUp().reset();
    getCountUp().start(() => {
      onEnd({ pauseResume, reset, start: restart, updateCount });
    });
    onStart({ pauseResume, reset, updateCount });
  };

  const pauseResume = () => {
    const { onPauseResume } = _props;
    getCountUp().pauseResume();
    onPauseResume({ reset, start: restart, updateCount });
  };

  const updateCount = (newEnd, newDur) => {
    const { onUpdate } = _props;
    const cup = getCountUp();
    cup.duration = newDur;
    cup.update(newEnd);
    onUpdate({ pauseResume, reset, start: restart });
  };

  useEffect(() => {
    const { delay, onStart, onEnd, startOnMount } = _props;
    if (startOnMount) {
      const timeout = setTimeout(() => {
        onStart({ pauseResume, reset, updateCount });
        getCountUp().start(() => {
          clearTimeout(timeout);
          onEnd({ pauseResume, reset, start: restart, updateCount });
        });
      }, delay * 1000);
    }
    return reset;
  }, []);

  return { countUp: count, start: restart, pauseResume, reset, updateCount };
};

export default useCountUp;
