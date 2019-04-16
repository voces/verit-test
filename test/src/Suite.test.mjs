
import assert from "assert";
import sinon from "sinon";
import stripAnsi from "strip-ansi";
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

		const callback = sinon.spy();

		const root = new Suite( "root" );
		const child = root.describe( "child", callback );

		assert.equal( root.children.child, child );
		assert.equal( root.childrenArr[ 0 ], child );
		assert.equal( child.name, "child" );
		assert( callback.called );

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

describe( "Suite#pass", () => {

	it( "empty", () => {

		const root = new Suite( "root" );

		assert( root.pass );

	} );

	it( "with child", async () => {

		const root = new Suite( "root" );
		root.it( "test", () => assert( false ) );
		await root.run( false );

		assert( ! root.pass );

	} );

	it( "memoizes", () => {

		const root = new Suite( "root" );
		root.pass;

		assert.deepStrictEqual(
			Object.getOwnPropertyDescriptor( root, "pass" ),
			{
				configurable: false,
				enumerable: false,
				value: true,
				writable: false
			}
		);

	} );

} );

const addTests = root => [
	root.it( "test1", () => assert( false ) ),
	root.it( "test2", () => {} ),
	root.it( "test3", () => {} ),
	root.it( "test4", { skip: true }, () => {} )
];

describe( "Suite#tests", () => {

	it( "empty", () => {

		const root = new Suite( "root" );

		assert.deepStrictEqual( root.tests, [] );

	} );

	it( "with children", async () => {

		const root = new Suite( "root" );
		const tests = addTests( root );

		assert.deepStrictEqual(
			root.tests,
			tests
		);

	} );

	it( "memoizes", () => {

		const root = new Suite( "root" );
		const tests = addTests( root );
		root.tests;

		assert.deepStrictEqual(
			Object.getOwnPropertyDescriptor( root, "tests" ),
			{
				configurable: false,
				enumerable: false,
				value: tests,
				writable: false
			}
		);

	} );

} );

describe( "Suite#passingTests", () => {

	it( "empty", () => {

		const root = new Suite( "root" );

		assert.deepStrictEqual( root.passingTests, [] );

	} );

	it( "with children", async () => {

		const root = new Suite( "root" );
		const tests = addTests( root );
		await root.run( false );

		assert.deepStrictEqual(
			root.passingTests,
			tests.slice( 1, 3 )
		);

	} );

	it( "memoizes", async () => {

		const root = new Suite( "root" );
		const tests = addTests( root );
		await root.run( false );
		root.passingTests;

		assert.deepStrictEqual(
			Object.getOwnPropertyDescriptor( root, "passingTests" ),
			{
				configurable: false,
				enumerable: false,
				value: tests.slice( 1, 3 ),
				writable: false
			}
		);

	} );

} );

describe( "Suite#failingTests", () => {

	it( "empty", () => {

		const root = new Suite( "root" );

		assert.deepStrictEqual( root.failingTests, [] );

	} );

	it( "with children", async () => {

		const root = new Suite( "root" );
		const tests = addTests( root );
		await root.run( false );

		assert.deepStrictEqual(
			root.failingTests,
			[ tests[ 0 ] ]
		);

	} );

	it( "memoizes", async () => {

		const root = new Suite( "root" );
		const tests = addTests( root );
		await root.run( false );
		root.failingTests;

		assert.deepStrictEqual(
			Object.getOwnPropertyDescriptor( root, "failingTests" ),
			{
				configurable: false,
				enumerable: false,
				value: [ tests[ 0 ] ],
				writable: false
			}
		);

	} );

} );

describe( "Suite#skippedTests", () => {

	it( "empty", () => {

		const root = new Suite( "root" );

		assert.deepStrictEqual( root.skippedTests, [] );

	} );

	it( "with children", async () => {

		const root = new Suite( "root" );
		const tests = addTests( root );
		await root.run( false );

		assert.deepStrictEqual(
			root.skippedTests,
			[ tests[ 3 ] ]
		);

	} );

	it( "memoizes", async () => {

		const root = new Suite( "root" );
		const tests = addTests( root );
		await root.run( false );
		root.skippedTests;

		assert.deepStrictEqual(
			Object.getOwnPropertyDescriptor( root, "skippedTests" ),
			{
				configurable: false,
				enumerable: false,
				value: [ tests[ 3 ] ],
				writable: false
			}
		);

	} );

} );

const asyncSpy = () => {

	const spy = sinon.spy();
	const callback = async () => spy();
	Object.defineProperty( callback, "called", { get() {

		return spy.called;

	} } );
	return callback;

};

describe( "Suite#run", () => {

	it( "runs befores and afters", async () => {

		const suite = new Suite( "suite" );

		const syncBefore = sinon.spy();
		suite.before( syncBefore );
		const asyncBefore = asyncSpy();
		suite.before( asyncBefore );
		const syncAfter = sinon.spy();
		suite.after( syncAfter );
		const asyncAfter = asyncSpy();
		suite.after( asyncAfter );

		const syncTest = sinon.spy();
		suite.it( "sync", syncTest );
		const asyncTest = asyncSpy();
		suite.it( "async", asyncTest );

		await suite.run( false );

		[
			syncBefore, asyncBefore,
			syncTest, asyncTest,
			syncAfter, asyncAfter
		].forEach( callback =>
			assert( callback.called ) );

	} );

	it( "attaches error", async () => {

		const root = new Suite( "root" );
		const suite = root.describe( "suite", suite => {

			suite.it( "test1" );
			assert( false );
			suite.it( "test2" );

		} );

		const errStr = "AssertionError [ERR_ASSERTION]: false == true";
		assert.equal( suite.err.toString(), errStr );
		assert.equal( suite.tests.length, 1 );
		assert.equal( suite.tests[ 0 ].err.toString(), errStr );

	} );

} );

describe( "Suite#toString", () => {

	describe( "skipping", () => {

		it( "via config", () => {

			const suite = new Suite( "suite", { skip: true } );

			assert.equal( stripAnsi( suite.toString() ), "suite" );

		} );

		it( "via being empty", () => {

			const suite = new Suite( "suite" );

			assert.equal( stripAnsi( suite.toString() ), "suite" );

		} );

		it( "via skipped tests", () => {

			const suite = new Suite( "suite" );
			suite.it( "test1", { skip: true } );
			suite.it( "test2", { skip: true } );

			assert.equal( stripAnsi( suite.toString() ), "suite" );

		} );

	} );

	it( "with some passing", async () => {

		const suite = new Suite( "suite" );
		suite.it( "test1", () => {} );
		suite.it( "test2", () => assert( false ) );
		await suite.run( false );

		assert(
			stripAnsi( suite.toString( false ) )
				.match( /^suite \[1\/2\] \([0-9.]+ms\)$/ )
		);

	} );

	it( "with an error", async () => {

		const root = new Suite( "root" );
		const suite = root.describe( "suite", () => assert( false ) );
		await suite.run( false );

		assert( stripAnsi( suite.toString() ).includes( "suite\nAssertionError" ) );

	} );

} );
