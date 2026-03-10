import { useEffect, useRef } from 'react';

export function useKeyboardHandler(onSpace: () => void, active: boolean) {
  const lastPressRef = useRef(0);
  const callbackRef = useRef(onSpace);
  callbackRef.current = onSpace;

  useEffect(() => {
    if (!active) return;

    const handler = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      e.preventDefault();

      const now = Date.now();
      if (now - lastPressRef.current < 150) return; // debounce
      lastPressRef.current = now;

      callbackRef.current();
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [active]);
}
