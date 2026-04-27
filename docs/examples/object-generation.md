# Generating an object via its constructor

`object(Class, g1, g2, ...)` lifts a class constructor into the `Generator`
applicative — every child generator becomes one positional argument. Run with:

```sh
npx tsx examples/object.generation.ts
```

## Source

<<< @/../examples/object.generation.ts

## Notes

- Use `object` when you have a real class and want instances back.
- Use [`record`](/examples/address) when you only need a plain JS object.
- Use [`objectGenerator`](/examples/address) when you need to derive the value
  from a function rather than a constructor.
