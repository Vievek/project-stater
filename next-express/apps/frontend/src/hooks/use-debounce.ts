import { useState, useEffect } from 'react';

/**
 * A hook that delays invoking a function or updating a value until after wait milliseconds
 * have elapsed since the last time the debounced function or value was updated.
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
