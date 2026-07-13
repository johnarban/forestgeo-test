import { isRef, type ComputedRef } from "vue";

export function isComputedRef(ref: unknown): ref is ComputedRef {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error A general `Ref` won't have `effect`
  return isRef(ref) && !!ref.effect;
}
