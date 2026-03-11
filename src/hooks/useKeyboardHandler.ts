import { useEffect, useRef } from 'react';

export function useKeyboardHandler(onSpace: () => void, active: boolean) {
  const lastPressRef = useRef(0);
  const callbackRef = useRef(onSpace);
  callbackRef.current = onSpace;

  useEffect(() => {
    if (!active) return;

    const debounce = () => {
      const now = Date.now();
      if (now - lastPressRef.current < 200) return false;
      lastPressRef.current = now;
      return true;
    };

    const onKeydown = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      e.preventDefault();
      if (debounce()) callbackRef.current();
    };

    const onPointer = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('button, input, label, .app__sidebar, .replica-list, .control-bar')) return;
      if (debounce()) callbackRef.current();
    };

    window.addEventListener('keydown', onKeydown);
    window.addEventListener('pointerdown', onPointer);
    return () => {
      window.removeEventListener('keydown', onKeydown);
      window.removeEventListener('pointerdown', onPointer);
    };
  }, [active]);
}
