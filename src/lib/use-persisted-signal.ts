import { type Accessor, createEffect, createSignal, on } from 'solid-js';

/**
 * A signal that automatically persists its value to localStorage.
 *
 * @param key - The localStorage key
 * @param defaultValue - Default value if nothing is stored
 * @param validate - Optional type guard; if it returns false, defaultValue is used
 */
export const usePersistedSignal = <T extends string>(
  key: string,
  defaultValue: T,
  validate?: (value: string) => value is T,
): [Accessor<T>, (value: T) => void] => {
  const stored = localStorage.getItem(key);
  const isValid = stored !== null && (validate ? validate(stored) : true);
  const initial = isValid ? (stored as T) : defaultValue;

  const [value, setValue] = createSignal<T>(initial);

  createEffect(
    on(value, (v) => {
      localStorage.setItem(key, v);
    }),
  );

  return [value, setValue];
};
