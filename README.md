
# verit-test

A basic JavaScript testing framework designed to work with `.mjs` files without need of a transpiler.

## Usage

### Installation

```
npm i -D verit-test
```

### Running


Aliases: `vt`, `vtest`, `verit-test`

The entire test suite:
```bash
# The entire test suite:
vt

# A glob:
vt test/**/*.test.mjs

# A specific file:
vt test/unit/src/App.test.mjs

# A specific test:
vt test/unit/src/App.test.mjs -l 126
```

### Configuration
Configuration can be passed directly to vt via command-line:
```
vt --foo=bar
```

And can be accessed via:
```js
it( "my test", test => {

    assert.equal( test.config.foo, "bar" );

} );
```

Configuration can also be passed per-suite or per-test:
```js
describe( "my suite", { foo: "bar" }, () => {

    it( "my test", { baz: "quz" }, test => {

        assert.equal( test.config.foo, "bar" );
        assert.equal( test.config.baz, "qux" );

    } );

} );
```

### CLI options

```
vt --help
Options:
  --help        Show help                                              [boolean]
  --version     Show version number                                    [boolean]
  --mocha-done  Use `done` callback argument          [boolean] [default: false]
  --parallel    Option to run tests in parallel        [boolean] [default: true]
  --globals     Option to attach global test helpers  [boolean] [default: false]
  --line, -l    Lines of tests and suites to run                        [number]
```