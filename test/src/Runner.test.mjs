
import assert from "assert";
import { sleep, time } from "../../src/util.mjs";
import { describe, it } from "../../index.mjs";
import Runner from "../../src/Runner.mjs";

describe( "Runner#describe", () => {

	it( "callback error", () => {

		const runner = new Runner();
		const fine = runner.describe( "fine", () => {} );
		const error = new Error( "my error" );
		const errored = runner.describe( "errored", suite => {

			suite.it( "was fine", () => {} );
			throw error;
			suite.it( "unreached", () => {} ); // eslint-disable-line no-unreachable

		} );

		assert.equal( fine.err, undefined );
		assert.equal( errored.err, error );
		assert.equal( errored.tests.length, 1 );
		assert.equal( errored.tests[ 0 ].err, error );

	} );

} );

describe( "Runner#run", () => {

	it( "parallel", async () => {

		const runner = new Runner( { parallel: true } );
		runner.describe( "suite1", suite =>
			suite.it( "test", async () => await sleep( 10 ) ) );
		runner.describe( "suite2", suite =>
			suite.it( "test", async () => await sleep( 10 ) ) );
		const { duration } = await time( runner.run( false ) );

		assert( duration > 10 );
		assert( duration < 20 );

	} );

} );
