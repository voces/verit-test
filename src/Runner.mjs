
import glob from "fast-glob";
import path from "path";
import chalk from "chalk";

import Suite from "./Suite.mjs";
import { time } from "./util.mjs";

const runSuite = async ( suite, print ) => {

	await suite.run( false );
	if ( print ) console.log( suite.toString() );

};

export default class Runner {

	constructor( config ) {

		this.suites = [];
		this.loaded = false;
		this.config( config );

		this.describe = ( name, config, callback ) => {

			if ( typeof config === "function" ) {

				callback = config;
				config = undefined;

			}

			const suite = this.cur = this.cur ?
				this.cur.describe( name, config ) :
				this.newSuite( name, config );
			this.cur.callback = callback;
			try {

				this.cur.callback( this.cur );

			} catch ( err ) {

				this.cur.err = err;
				this.cur.tests.forEach( test => test.err = err );

			}
			this.cur = this.cur.parent;

			return suite;

		};

		this.it = ( ...args ) => this.cur.it( ...args );
		this.before = name => this.cur.before( name );
		this.beforeEach = name => this.cur.beforeEach( name );
		this.after = name => this.cur.after( name );
		this.afterEach = name => this.cur.afterEach( name );

	}

	get suiteConfig() {

		return {
			parallel: this.parallel,
			...this.user
		};

	}

	config( {
		glob = [ "**/*.test.mjs", "!node_modules/**" ],
		files,
		parallel,
		...user
	} = {} ) {

		// TODO: right now we only allow files or glob; we should allow both?
		// Maybe files can just be treated as glob?
		this.files = files;
		if ( ! files ) this.glob = glob;
		else this.glob = undefined;

		this.parallel = parallel;

		this.user = user;

	}

	newSuite( name, config ) {

		const suite = new Suite( name, { ...this.suiteConfig, ...config } );
		this.suites.push( suite );
		return suite;

	}

	async load() {

		this.suites = [];
		this.loaded = true;

		const files = this.files || await glob.async( this.glob, { dot: true } );

		// We do it in serial so describes remain in order
		for ( let i = 0; i < files.length; i ++ ) {

			const suite = this.newSuite( files[ i ] );
			this.cur = suite;
			await import( path.join( process.cwd(), files[ i ] ) ).catch( err => suite.err = err );
			this.cur = undefined;

		}

	}

	async run( print = true ) {

		const { duration } = await time( async() => {

			if ( this.parallel )
				await Promise.all( this.suites.map( suite => runSuite( suite, print ) ) );

			else
				for ( let i = 0; i < this.suites.length; i ++ )
					await runSuite( this.suites[ i ], print );

		} );

		this.duration = duration;

		if ( print ) this.print( false );

	}

	get pass() {

		return this.suites.every( suite => suite.pass );

	}

	get passingTests() {

		Object.defineProperty( this, "passingTests", {
			value: this.tests.filter( t => t.pass )
		} );
		return this.passingTests;

	}

	get failingTests() {

		Object.defineProperty( this, "failingTests", {
			value: this.tests.filter( t => t.fail )
		} );
		return this.failingTests;

	}

	get skippedTests() {

		Object.defineProperty( this, "skippedTests", {
			value: this.tests.filter( t => ! t.fail && t.config.skip )
		} );
		return this.skippedTests;

	}

	get tests() {

		Object.defineProperty( this, "tests", {
			value: [].concat( ...this.suites.map( suites => suites.tests ) )
		} );
		return this.tests;

	}

	print( fullPrint = true ) {

		if ( fullPrint )
			for ( let i = 0; i < this.suites.length; i ++ )
				console.log( this.suites[ i ].toString() );

		console.log( "" );

		console.log( chalk.green( "%d tests passing" ), this.passingTests.length );
		console.log( chalk.red( "%d tests failing" ), this.failingTests.length );
		if ( this.skippedTests.length ) console.log( chalk.yellow( "%d tests skipped" ), this.skippedTests.length );
		console.log( chalk.gray( `Total duration: ${this.duration.toFixed( 2 )}ms` ) );

	}

}
