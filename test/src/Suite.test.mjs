
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

		const suite = new Suite( "suite" );

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

		const root = new Suite( "root" );
		const child = root.describe( "child", caller );

		assert.equal( root.children.child, child );
		assert.equal( root.childrenArr[ 0 ], child );
		assert.equal( child.name, "child" );
		assert( called );

	} );

	it( "without callback", () => {

		// We expect no error
		new Suite( "root" ).describe( "child" );

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

		const suite = new Suite( "root", { foo: "bar" } );
		const callback = sinon.spy();
		const test = suite.it( "test", { foo: "baz" }, callback );

		assert.equal( test.name, "test" );
		assert.equal( test.config.foo, "baz" );
		assert.equal( suite.children.test, test );
		assert.equal( suite.config.foo, "bar" );
		assert.equal( test.callback, callback );
		assert( ! callback.called );

	} );

	it( "without config", () => {

		const suite = new Suite( "root", { foo: "bar" } );
		const callback = sinon.spy();
		const test = suite.it( "test", callback );

		assert.equal( test.name, "test" );
		assert.equal( test.config.foo, "bar" );
		assert.equal( suite.config.foo, "bar" );
		assert.equal( test.callback, callback );
		assert( ! callback.called );

	} );

} );

it( "Suite#before", () => {

	const suite = new Suite( "suite" );
	const callback = () => {};
	suite.before( callback );

	assert( suite.befores.includes( callback ) );

} );

it( "Suite#beforeEach", () => {

	const suite = new Suite( "suite" );
	const callback = () => {};
	suite.beforeEach( callback );

	assert( suite.beforeEaches.includes( callback ) );

} );

it( "Suite#after", () => {

	const suite = new Suite( "suite" );
	const callback = () => {};
	suite.after( callback );

	assert( suite.afters.includes( callback ) );

} );

it( "Suite#afterEach", () => {

	const suite = new Suite( "suite" );
	const callback = () => {};
	suite.afterEach( callback );

	assert( suite.afterEaches.includes( callback ) );

} );

describe( "Suite#add", () => {

	it( "works", () => {

		const root = new Suite( "suite" );
		const child = new Suite( "child", root );

		assert( ! root.children.child );

		root.add( child );

		assert.equal( root.children.child, child );
		assert.equal( root.childrenArr[ 0 ], child );

	} );

	it( "throws on collisions", () => {

		const root = new Suite( "root" );
		root.it( "child" );
		const child = new Suite( "child", root );

		let error;
		try {

			root.add( child );

		} catch ( err ) {

			error = err;

		}

		assert( error.message.includes( "Rewriting suite root/child" ) );

	} );

} );

it( "Suite#traverse", () => {

	const tree = new Suite( "tree" )
		.describe( "tree_0" )
		.describe( "tree_0_0" )
		.it( "tree_0_0_0" ).parent.parent
		.it( "tree_0_1" ).parent.parent
		.describe( "tree_1" )
		.it( "tree_1_0" ).parent
		.describe( "tree_1_1" )
		.it( "tree_1_1_0" ).parent.parent.parent;

	const nodes = [];
	tree.traverse( node => nodes.push( node.name ) );

	assert.equal( nodes.length, 9 );
	assert.deepStrictEqual( nodes, [ ...nodes ].sort() );

} );
