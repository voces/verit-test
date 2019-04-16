
import assert from "assert";
import { describe, it, beforeEach } from "../../index.mjs";
import Node from "../../src/Node.mjs";

describe( "Node#constructor", () => {

	it( "sets name, parent, and config default", () => {

		const node = new Node( 0, undefined, 1 );

		assert.equal( node.name, 0 );
		assert.deepEqual( node.rawConfig, {} );
		assert.equal( node.parent, 1 );

	} );

	it( "sets config if passed", () => {

		const node = new Node( 0, 1 );

		assert.equal( node.rawConfig, 1 );

	} );

} );

describe( "Node#path", () => {

	it( "root", () => {

		const node = new Node( "abc" );

		assert.equal( node.path(), "abc" );

	} );

	it( "undefined root", () => {

		const node = new Node();

		assert.equal( node.path(), "undefined" );

	} );

	it( "next", () => {

		const node = new Node( "abc" );

		assert.equal( node.path( "123" ), "abc/123" );

	} );

	it( "tree + next", () => {

		const root = new Node( "root" );
		const a = new Node( "a", null, root );
		const b = new Node( "b", null, a );

		assert.equal( b.path( "c" ), "root/a/b/c" );

	} );

} );

describe( "Node#config", () => {

	it( "uses node's config value if set", () => {

		class ExtendedNode extends Node {}
		ExtendedNode.foo = "bar";
		const root = new ExtendedNode( "root", { foo: "baz" } );
		const child = new ExtendedNode( "child", { foo: "qux" }, root );

		assert.equal( child.config.foo, "qux" );

		delete ExtendedNode.foo;

	} );

	it( "uses root's config value if set and child's is not", () => {

		class ExtendedNode extends Node {}
		ExtendedNode.foo = "bar";
		const root = new ExtendedNode( "root", { foo: "baz" } );
		const child = new ExtendedNode( "child", null, root );

		assert.equal( child.config.foo, "baz" );

		delete ExtendedNode.foo;

	} );

	it( "uses klass static value if child and root configs are not set", () => {

		class ExtendedNode extends Node {}
		ExtendedNode.foo = "bar";
		const root = new ExtendedNode( "root" );
		const child = new ExtendedNode( "child", null, root );

		assert.equal( child.config.foo, "bar" );

		delete ExtendedNode.foo;

	} );

	it( "can set config values after the fact", () => {

		const node = new Node();
		node.config.foo = "bar";

		assert.equal( node.config.foo, "bar" );

	} );

} );

describe( "Node#level", () => {

	it( "root", () => {

		const root = new Node();

		assert.equal( root.level, 0 );

	} );

	it( "child", () => {

		const root = new Node();
		const child = new Node( "child", null, root );

		assert.equal( child.level, 1 );

	} );

	it( "grandchild", () => {

		const root = new Node();
		const child = new Node( "child", null, root );
		const grandchild = new Node( "grandchild", null, child );

		assert.equal( grandchild.level, 2 );

	} );

	it( "memoizes", () => {

		const node = new Node();
		node.level;

		assert.deepStrictEqual(
			Object.getOwnPropertyDescriptor( node, "level" ),
			{
				configurable: false,
				enumerable: false,
				value: 0,
				writable: false
			}
		);

	} );

} );

describe( "Node#duration", () => {

	beforeEach( test => {

		const node = test.node = new Node();
		node.start = 7;
		node.end = 13;

	} );

	it( "works", function () {

		assert.equal( this.node.duration, 6 );

	} );

	it( "memoizes", function () {

		this.node.duration;

		assert.deepStrictEqual(
			Object.getOwnPropertyDescriptor( this.node, "duration" ),
			{
				configurable: false,
				enumerable: false,
				value: 6,
				writable: false
			}
		);

	} );

} );

describe( "Node#fullName", () => {

	it( "single node", () => {

		const node = new Node( "node" );

		assert.equal( node.fullName, "node" );

	} );

	it( "many nodes", () => {

		const root = new Node( "root" );
		const child1 = new Node( "child1", root );
		const child2 = new Node( "child2", child1 );
		new Node( "child3", child2 );

		assert.equal( child2.fullName, "root/child1/child2" );

	} );

} );

it( "Node#timeout", async () => {

	const node = new Node();
	node.timeout( 17 );

	assert.equal( node.config.timeout, 17 );

} );
