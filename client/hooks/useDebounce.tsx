import { useRef, useState, useCallback } from "react";

export function useDebouncedState<T>(
  initialValue: T,
  delay = 300,
): [T, (value: T) => void] {
  const [state, setState] = useState<T>(initialValue);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setDebouncedState = useCallback(
    (value: T) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        setState(value);
      }, delay);
    },
    [delay],
  );

  return [state, setDebouncedState];
}
