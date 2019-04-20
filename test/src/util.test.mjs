
import assert from "assert";
import chai from "chai";
import { describe, it } from "../../index.mjs";
import { clock, sleep, time, timeout, key, memoize } from "../../src/util.mjs";

const { expect } = chai;

describe( "clock", () => {

	it( "clock is somewhat accurate to within 1ms", done => {

		const trueStart = Date.now();
		const testStart = clock();

		setTimeout( () => {

			const trueEnd = Date.now();
			const testEnd = clock();

			assert( Math.abs( trueEnd - trueStart - ( testEnd - testStart ) ) < 1 );

			done();

		}, 25 );

	} );

} );

it( "sleep", async () => {

	const start = Date.now();
	await sleep( 10 );
	const end = Date.now();

	expect( end - start ).to.be.within( 10, 100 );

} );

describe( "time", () => {

	it( "async", async () => {

		const { start, result, end, duration } = await time( async () => {

			await sleep( 10 );
			return 7;

		} );

		assert.equal( end - start, duration );
		assert( duration > 10 && duration < 100 );
		assert.equal( result, 7 );

	} );

	it( "sync", async () => {

		const { start, result, end, duration } = await time( () => 7 );

		assert.equal( end - start, duration );
		assert( duration > 0 && duration < 1 );
		assert.equal( result, 7 );

	} );

} );

describe( "timeout", { parallel: false }, () => {

	it( "works against async functions", async () => {

		const cb = new Promise( () => {} );
		const start = Date.now();
		await timeout( cb, 10 ).catch( () => {} );
		const end = Date.now();

		expect( end - start ).to.be.within( 10, 30 );

	} );

	it( "works against heavy functions", { skip: true }, async () => {

		const cb = async () => {

			let n = 0;
			for ( let i = 0; i < 100000000; i ++ )
				n ++;
			return n;

		};

		const start = Date.now();
		await timeout( cb(), 10 ).catch( () => {} );
		const end = Date.now();

		expect( end - start ).to.be.within( 10, 30 );

	} );

} );

describe( "key", () => {

	it( "zero args", () => {

		const res1 = key();
		const res2 = key();
		const res3 = key( 1 );

		assert.equal( res1, res2 );
		assert.notEqual( res1, res3 );

	} );

	it( "one arg", () => {

		const res1 = key( 1 );
		const res2 = key( 1 );
		const res3 = key( 2 );

		assert.equal( res1, res2 );
		assert.notEqual( res1, res3 );

	} );

	it( "two args", () => {

		const res1 = key( 1, 2 );
		const res2 = key( 1, 2 );
		const res3 = key( 1, 3 );

		assert.equal( res1, res2 );
		assert.notEqual( res1, res3 );

	} );

	it( "mixed types", () => {

		const obj = {};
		const res1 = key( 1, obj );
		const res2 = key( 1, obj );
		const res3 = key( 1, {} );

		assert.equal( res1, res2 );
		assert.notEqual( res1, res3 );

	} );

	it( "ordered", () => {

		const res1 = key( 1, 2 );
		const res2 = key( 2, 1 );

		assert.notEqual( res1, res2 );

	} );

	it( "frozen keys", () => {

		const res1 = key( {} );
		let errored = false;
		try {

			res1.push( {} );

		} catch ( err ) {

			errored = true;

		}

		assert( errored );

		errored = false;
		try {

			res1[ 0 ] = 12;

		} catch ( err ) {

			errored = true;

		}

		assert( errored );

		errored = false;
		try {

			res1[ 1 ] = 12;

		} catch ( err ) {

			errored = true;

		}

		assert( errored );

		res1[ 0 ].canSet = 12;

	} );

} );

describe( "memoize", () => {

	it( "zero args", () => {

		const cb = () => ( {} );
		const memoized = memoize( cb );
		const res1 = memoized();
		const res2 = memoized();
		const res3 = memoized( 1 );

		assert.equal( res1, res2 );
		assert.notEqual( res1, res3 );

	} );

	it( "one arg", () => {

		// debugger;
		const cb = () => ( {} );
		const memoized = memoize( cb );
		const res1 = memoized( 1 );
		const res2 = memoized( 1 );
		const res3 = memoized( 2 );

		assert.equal( res1, res2 );
		assert.notEqual( res1, res3 );

	} );

	it( "two args", () => {

		const cb = () => ( {} );
		const memoized = memoize( cb );
		const res1 = memoized( 1, 2 );
		const res2 = memoized( 1, 2 );
		const res3 = memoized( 1, 3 );

		assert.equal( res1, res2 );
		assert.notEqual( res1, res3 );

	} );

	it( "mixed types", () => {

		const cb = () => ( {} );
		const memoized = memoize( cb );
		const obj = {};
		const res1 = memoized( 1, obj );
		const res2 = memoized( 1, obj );
		const res3 = memoized( 1, {} );

		assert.equal( res1, res2 );
		assert.notEqual( res1, res3 );

	} );

} );
