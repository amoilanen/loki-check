/**
 * Optional value abstraction returned by {@link Generator.generate}.
 *
 * Distinguishes between "the generator produced a value" ({@link Some}) and
 * "the generator could not produce a value" ({@link None} / {@link none}).
 */
export interface Maybe<T> {
  /** `true` for {@link Some}, `false` for {@link None}. */
  isDefined: boolean;
  /** The wrapped value. Reading on a {@link None} throws. */
  value: T;
  /** Returns a new `Maybe` whose value is `f(value)`, or `none` if absent. */
  map<U>(f: (value: T) => U): Maybe<U>;
  /** Monadic bind. Returns `f(value)` for {@link Some}, otherwise `none`. */
  flatMap<U>(f: (value: T) => Maybe<U>): Maybe<U>;
  /** Returns the wrapped value, or throws if this is a {@link None}. */
  get(): T;
}

/**
 * Companion namespace for {@link Maybe}. Use {@link Maybe.pure} to lift a
 * value into a `Maybe`, mapping `null`/`undefined` to {@link none}.
 */
export const Maybe = {
  /**
   * Lifts `value` into a {@link Maybe}. Returns {@link none} for `null` or
   * `undefined`, and {@link Some} for everything else.
   */
  pure: function<U>(value: U): Maybe<U> {
    if (value !== undefined && value !== null) {
      return new Some(value);
    } else {
      return none;
    }
  }
}

/**
 * `Maybe` instance carrying a defined value.
 */
export class Some<T> implements Maybe<T> {
  constructor(readonly value: T) {
  }
  /** Always `true` for `Some`. */
  isDefined = true
  /** Returns the wrapped value. */
  get(): T {
    return this.value;
  }
  /** Returns `Some(f(value))`. */
  map<U>(f: (value: T) => U): Maybe<U> {
    return new Some(f(this.value));
  }
  /** Returns `f(value)`. */
  flatMap<U>(f: (value: T) => Maybe<U>): Maybe<U> {
    return f(this.value);
  }
}

/**
 * `Maybe` instance representing the absence of a value. Use the {@link none}
 * singleton rather than constructing instances directly.
 */
export class None<T> implements Maybe<T> {
  private constructor() {
  }
  /** Always `false` for `None`. */
  isDefined = false
  /** Throws — `None` carries no value. */
  get value(): T {
    return this.get();
  }
  /** Throws — `None` carries no value. */
  get(): T {
    throw new Error('None: accessing undefined value');
  }
  /** Returns `none` regardless of `f`. */
  map<U>(_f: (value: T) => U): Maybe<U> {
    return None.none;
  }
  /** Returns `none` regardless of `f`. */
  flatMap<U>(_f: (value: T) => Maybe<U>): Maybe<U> {
    return None.none;
  }
  /** Shared singleton instance — prefer {@link none}. */
  static none: Maybe<any> = new None();
};

/**
 * The shared {@link None} singleton. Returned by generators that cannot
 * produce a value (e.g. an exhausted `suchThat` or `never()`).
 */
export const none: Maybe<any> = None.none;
