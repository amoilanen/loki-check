# Sized recursive tree

A binary-ish tree generator that uses `sized` and `resize` to bound recursion
depth. Run with:

```sh
npx tsx examples/sized.tree.ts
```

## Source

<<< @/../examples/sized.tree.ts

## Notes

- `sized` reads the current size hint off the `Random` source; `resize`
  fixes it for a sub-generator.
- The base case (when `size <= 0`) returns a leaf with no children, so the
  recursion always terminates.
- Each recursive position halves the size, so six levels of recursion is
  the most you'll see with the default size of `100`.
- Use `Generators.resize(initialSize, tree)` from the call site if you want
  to dial the maximum depth up or down.
