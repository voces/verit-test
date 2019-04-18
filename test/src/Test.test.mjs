
import assert from "assert";
import { describe, it } from "../../index.mjs";
import { sleep, time } from "../../src/util.mjs";
import Test from "../../src/Test.mjs";

describe( "Test#constructor", () => {

	it( "name and callback", () => {

		const callback = () => {};
		const test = new Test( "test", callback );

		assert.equal( test.name, "test" );
		assert.equal( test.callback, callback );

	} );

	it( "name, config, and callback", () => {

		const callback = () => {};
		const test = new Test( "test", { foo: "bar" }, callback );

		assert.equal( test.name, "test" );
		assert.equal( test.config.foo, "bar" );
		assert.equal( test.callback, callback );

	} );

	it( "name, callback, and parent", () => {

		const callback = () => {};
		const test = new Test( "test", callback, "parent" );

		assert.equal( test.name, "test" );
		assert.equal( test.callback, callback );
		assert.equal( test.parent, "parent" );

	} );

	it( "name, config, callback, and parent", () => {

		const callback = () => {};
		const test = new Test( "test", { foo: "bar" }, callback, "parent" );

		assert.equal( test.name, "test" );
		assert.equal( test.config.foo, "bar" );
		assert.equal( test.callback, callback );
		assert.equal( test.parent, "parent" );

	} );

} );

describe( "Test#run", () => {

	it( "timeout", async () => {

		const test = new Test( "test", { timeout: 10 }, async () => sleep( 100 ) );
		const { duration } = await time( test.run( false ) );

		assert( duration > 10 && duration < 100 );

	} );

	it( "without timeout", async () => {

		const test = new Test( "test", { timeout: undefined }, async () => sleep( 10 ) );
		const { duration } = await time( test.run( false ) );

		assert( duration > 10 );

	} );

} );

describe( "Test#toString", () => {

	it( "with error", async () => {

		const test = new Test( "test", () => assert( false ) );
		await test.run( false );

		assert( test.toString().includes( "✗" ) );
		assert( test.toString().includes( "AssertionError [ERR_ASSERTION]: false == true" ) );

	} );

} );
