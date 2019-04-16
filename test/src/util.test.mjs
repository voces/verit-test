
import assert from "assert";
import { describe, it } from "../../index.mjs";
import { clock, sleep, timeout } from "../../src/util.mjs";

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

	assert( end - start >= 10 );
	assert( end - start < 20 );

} );

describe( "timeout", { parallel: false }, () => {

	it( "works against async functions", async () => {

		const cb = new Promise( () => {} );
		const start = Date.now();
		await timeout( cb, 10 ).catch( () => {} );
		const end = Date.now();

		assert( end - start >= 10 );
		assert( end - start < 20 );

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

		assert( end - start >= 10 );
		assert( end - start < 20 );

	} );

} );
