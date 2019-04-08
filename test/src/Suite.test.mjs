
import assert from "assert";
import sinon from "sinon";
import { describe, it } from "../../index.mjs";
import Suite from "../../src/Suite.mjs";

describe( "Suite#constructor", () => {

	it( "params", () => {

		const suite = new Suite( "foobar", { foo: "bar" }, { baz: "qux" } );

		assert.equal( suite.name, "foobar" );
		assert.equal( suite.config.foo, "bar" );
		assert.deepStrictEqual( suite.parent, { baz: "qux" } );

	} );

	it( "other initial values", () => {

		const suite = new Suite();

		assert.deepStrictEqual( suite.childrenMap, {} );
		assert.deepStrictEqual( suite.childrenArr, [] );
		assert.equal( suite.children, suite.childrenMap );
		assert.deepStrictEqual( suite.befores, [] );
		assert.deepStrictEqual( suite.beforeEaches, [] );
		assert.deepStrictEqual( suite.afters, [] );
		assert.deepStrictEqual( suite.afterEaches, [] );

	} );

} );

describe( "Suite#describe", () => {

	it( "with callback", () => {

		let called = false;
		const caller = () => called = true;

		const root = new Suite();
		const child = root.describe( "child", caller );

		assert.equal( root.children.child, child );
		assert.equal( root.childrenArr[ 0 ], child );
		assert.equal( child.name, "child" );
		assert( called );

	} );

	it( "without callback", () => {

		// We expect no error
		new Suite().describe( "child" );

	} );

	it( "config", () => {

		const root = new Suite( "root", { foo: "bar", baz: "qux" } );
		const callback = sinon.spy();
		const child = root.describe( "child", { foo: "baz" }, callback );

		assert.equal( root.config.foo, "bar" );
		assert( callback.called );
		assert.equal( child.config.foo, "baz" );
		assert.equal( child.config.baz, "qux" );

	} );

} );

describe( "Suite#it", () => {

	it( "with config", () => {

		const suite = new Suite( "root", { foor: "bar" } );
		const callback = sinon.spy();
		const test = suite.it( "test", { foo: "baz" }, callback );

		assert.equal( test.name, "test" );
		assert.equal( test.config.foo, "baz" );
		assert.equal( suite.config.foo, "bar" );
		assert.equal( test.callback, callback );
		assert( ! callback.called );

	} );

	it( "without config", () => {

		const suite = new Suite( "root", { foor: "bar" } );
		const callback = sinon.spy();
		const test = suite.it( "test", callback );

		assert.equal( test.name, "test" );
		assert.equal( test.config.foo, "bar" );
		assert.equal( suite.config.foo, "bar" );
		assert.equal( test.callback, callback );
		assert( ! callback.called );

	} );

} );
