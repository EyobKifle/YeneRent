import { useEffect } from 'react';

/**
 * A custom hook that triggers a callback when a click is detected outside of a specified element.
 * @param {React.RefObject<HTMLElement>} ref - The ref of the element to detect outside clicks for.
 * @param {() => void} handler - The function to call when an outside click is detected.
 */
const useClickOutside = (ref, handler) => {
  useEffect(() => {
    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) {
        return;
      }
      handler(event);
    };
    document.addEventListener('mousedown', listener);
    return () => document.removeEventListener('mousedown', listener);
  }, [ref, handler]);
};

export default useClickOutside;