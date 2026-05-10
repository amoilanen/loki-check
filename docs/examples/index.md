# Examples

Each example below is a runnable file in the [`examples/`](https://github.com/amoilanen/loki-check/tree/master/examples)
directory of the repo. They run as part of the test suite via
`npm run test:examples`, so you can be confident any snippet you copy here will
actually execute end-to-end.

| Example | What it shows |
| ------- | ------------- |
| [Address](/examples/address) | Nested `record` / `objectGenerator` and `oneOfValues` |
| [Object generation](/examples/object-generation) | Constructor-applicative `object(Class, ...)` |
| [Phone number](/examples/phone) | String templating with `concat`, `numericString`, `pure` |
| [Property test](/examples/property-test) | `forAll.assert` driving a property check |
| [UUID](/examples/uuid) | `uuid()` and when (not) to use it |
| [Variable name](/examples/variable-name) | `identifier(...)` plus `filter` for reserved words |
