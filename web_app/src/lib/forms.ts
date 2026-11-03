import type { UseFormRegisterReturn } from 'react-hook-form';

/**
 * Adapts react-hook-form's `register()` to MUI TextField: the ref must reach the native
 * <input> (`inputRef`), not TextField's root div, or focus/autofill/label state break.
 */
export function muiField<Name extends string>({ ref, ...rest }: UseFormRegisterReturn<Name>) {
  return { ...rest, inputRef: ref };
}
