
import glob from "fast-glob";
import path from "path";
import chalk from "chalk";

import Suite from "./Suite.mjs";

export default class Runner {

	constructor( config ) {

		this.loaded = false;
		this.config( config );

		this.describe = ( name, config, callback ) => {

			if ( typeof config === "function" ) {

				callback = config;
				config = undefined;

			}

			this.cur = this.cur.describe( name, config );
			this.cur.callback = callback;
			let result;
			try {

				result = this.cur.callback( this.cur );

			} catch ( err ) {

				this.cur.tests.forEach( test => {

					test.config.skip = true;
					test.err = err;

				} );

			}
			this.cur = this.cur.parent;

			return result;

		};

		this.it = ( ...args ) => this.cur.it( ...args );
		this.before = name => this.cur.before( name );
		this.beforeEach = name => this.cur.beforeEach( name );
		this.after = name => this.cur.after( name );
		this.afterEach = name => this.cur.afterEach( name );

	}

	get suiteConfig() {

		return {
			mochaDone: this.mochaDone,
			parallel: this.parallel,
			...this.user
		};

	}

	config( {
		glob = [ "**/*.test.mjs", "!node_modules/**" ],
		files,
		mochaDone,
		parallel,
		...user
	} = {} ) {

		// TODO: right now we only allow files or glob; we should allow both?
		// Maybe files can just be treated as glob?
		this.files = files;
		if ( ! files ) this.glob = glob;
		else this.glob = undefined;

		this.mochaDone = mochaDone;
		this.parallel = parallel;

		this.user = user;

	}

	async load() {

		this.suites = [];
		this.loaded = true;

		const files = this.files || await glob.async( this.glob, { dot: true } );

		// We do it in serial so describes remain in order
		// TODO: is this required after converting to Runner?
		for ( let i = 0; i < files.length; i ++ ) {

			const suite = new Suite( files[ i ], this.suiteConfig );
			this.cur = suite;
			this.suites.push( suite );
			await import( path.join( process.cwd(), files[ i ] ) ).catch( err => suite.err = err );
			this.cur = undefined;

		}

	}

	async run( print = true ) {

		if ( ! this.loaded ) await this.load();

		if ( this.parallel )
			await Promise.all( this.suites.map( suite => suite.run( false ) ) );

		else
			for ( let i = 0; i < this.suites.length; i ++ )
				await this.suites[ i ].run( false );

		if ( print ) this.print();

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

	print() {

		for ( let i = 0; i < this.suites.length; i ++ )
			console.log( this.suites[ i ].toString() );

		console.log( "" );

		console.log( chalk.green( "%d tests passing" ), this.passingTests.length );
		console.log( chalk.red( "%d tests failing" ), this.failingTests.length );
		if ( this.skippedTests.length ) console.log( chalk.yellow( "%d tests skipped" ), this.skippedTests.length );

	}

}
