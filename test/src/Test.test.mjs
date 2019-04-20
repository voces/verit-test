
import assert from "assert";
import chai from "chai";
import { describe, it } from "../../index.mjs";
import { sleep, time } from "../../src/util.mjs";
import Test from "../../src/Test.mjs";

const { expect } = chai;

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

		const test = new Test( "test", { timeout: 10 }, async () => sleep( 1000 ) );
		const { duration } = await time( test.run( false ) );

		expect( duration ).to.be.within( 9, 999 );

	} );

	it( "without timeout", async () => {

		const test = new Test( "test", { timeout: undefined }, async () => sleep( 10 ) );
		const { duration } = await time( test.run( false ) );

		expect( duration ).to.be.greaterThan( 9 );

	} );

	describe( "done", () => {

		it( "times out if not called", async () => {

			const test = new Test( "test", { timeout: 10 }, done => {} ); // eslint-disable-line no-unused-vars
			const { duration } = await time( test.run( false ) );

			expect( duration ).to.be.within( 9, 1000 );
			expect( test.err.toString() ).to.equal( "Error: Expected `done` to be called within 10ms" );

		} );

		it( "sync", async () => {

			const test = new Test( "test", { timeout: 10 }, done => done() );
			const { duration } = await time( test.run( false ) );

			expect( duration ).to.be.lessThan( 9 );
			expect( test.err ).to.be.undefined;

		} );

		it( "async", async () => {

			const test = new Test( "test", { timeout: 10 }, async done => {

				await sleep( 10 );
				done();
				await sleep( 100 );

			} );
			const { duration } = await time( test.run( false ) );

			expect( duration ).to.be.within( 9, 109 );
			expect( test.err ).to.be.undefined;

		} );

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
