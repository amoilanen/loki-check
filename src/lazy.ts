/**
 * Defers evaluation of a thunk. Used internally by {@link recursive} to break
 * the otherwise-infinite recursion when describing self-referential generators.
 */
export class Lazy<T> {
  constructor(private readonly value: () => T) {
  }

  /** Forces evaluation and returns the produced value. */
  force(): T {
    return this.value();
  }
}
