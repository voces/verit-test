
import chai from "chai";
import stripAnsi from "strip-ansi";
import { sleep, time } from "../../src/util.mjs";
import { describe, it } from "../../index.mjs";
import Runner from "../../src/Runner.mjs";

const { expect } = chai;

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

		expect( fine.err ).to.be.undefined;
		expect( errored.err ).to.equal( error );
		expect( errored.tests ).to.have.lengthOf( 1 );
		expect( errored.tests[ 0 ].err ).to.equal( error );

	} );

} );

describe( "Runner#run", () => {

	it( "parallel", async () => {

		const runner = new Runner( { parallel: true } );
		for ( let i = 0; i < 10; i ++ )
			runner.describe( `suite${i}`, () =>
				runner.it( "test", async () => await sleep( 10 ) ) );
		const { duration } = await time( runner.run( false ) );

		expect( duration ).to.be.within( 10, 90 );

	} );

	it( "serial", async () => {

		const runner = new Runner( { parallel: false } );
		for ( let i = 0; i < 3; i ++ )
			runner.describe( `suite${i}`, () =>
				runner.it( "test", async () => await sleep( 10 ) ) );
		const { duration } = await time( runner.run( false ) );

		expect( duration ).to.be.within( 30, 200 );

	} );

} );

it( "Runner#pass", () => {

	const runner = new Runner( { parallel: true } );
	runner.describe( "passes", () => {} );
	runner.describe( "fails", () => expect( true ).to.be.false );

	expect( runner.pass ).to.be.false;

} );

describe( "Runner#toString", () => {

	it( "suite fail", async () => {

		const runner = new Runner( { parallel: true, failingTests: true } );
		runner.describe( "passes", () => {} );
		runner.describe( "fails", () => expect( true ).to.be.false );
		await runner.run( false );

		expect( stripAnsi( runner.toString() ) ).to.contain( "Focus on failing tests:\nvt fails" );

	} );

	it( "test fails", async () => {

		const runner = new Runner( { parallel: true, failingTests: true } );
		runner.describe( "passes", () => {} );
		runner.describe( "fails", () => {

			runner.it( "passes", () => {} );
			runner.it( "fails1", () => expect( true ).to.be.false );
			runner.it( "fails2", () => expect( true ).to.be.false );

		} );
		await runner.run( false );

		expect( stripAnsi( runner.toString() ) )
			.to.contain( "Focus on failing tests:\nvt fails -t fails1 -t fails2" );

	} );

} );
