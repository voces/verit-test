
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

		// These methods are expected to be called without a target,
		// thus we define them as arrow functions
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
		this.before = callback => this.cur.before( callback );
		this.beforeEach = callback => this.cur.beforeEach( callback );
		this.after = callback => this.cur.after( callback );
		this.afterEach = callback => this.cur.afterEach( callback );

	}

	get suiteConfig() {

		return {
			...this.rawConfig
		};

	}

	config( {
		glob = [ "**/*.test.mjs", "!node_modules/**" ],
		files,
		...config
	} = {} ) {

		this.files = files;
		if ( ! files ) this.glob = glob;
		else this.glob = undefined;

		this.rawConfig = config;

	}

	newSuite( name, config ) {

		const suite = new Suite( name, { ...this.suiteConfig, ...config } );
		// if ( suite.fullName.includes( ".mjs/" ) )
		// 	debugger;

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

			if ( this.rawConfig.parallel )
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

	get fail() {

		return this.suites.some( suite => suite.fail );

	}

	get tests() {

		Object.defineProperty( this, "tests", {
			value: [].concat( ...this.suites.map( suites => suites.tests ) )
		} );
		return this.tests;

	}

	get allSuites() {

		Object.defineProperty( this, "allSuites", {
			value: [].concat( ...this.suites.map( suites => suites.suites ) )
		} );
		return this.allSuites;

	}

	toString( fullPrint = true ) {

		const strs = [];

		if ( fullPrint )
			for ( let i = 0; i < this.suites.length; i ++ )
				strs.push( this.suites[ i ].toString() );

		strs.push( "" );

		{

			const passingFiles = this.suites.filter( suite => suite.pass ).length;
			const failingFiles = this.suites.filter( suite => suite.fail ).length;
			const skippedFiles = this.suites.filter( suite => suite.config.skip ).length;

			strs.push( [
				`Files:  ${chalk.green( `${passingFiles} passed` )}`,
				failingFiles && chalk.red( `${failingFiles} failed` ),
				skippedFiles && chalk.yellow( `${skippedFiles} skipped` )
			].filter( Boolean ).join( ", " ) );

		}

		{

			const passingSuites = this.allSuites.filter( suite => suite.pass ).length;
			const failingSuites = this.allSuites.filter( suite => suite.fail ).length;
			const skippedSuites = this.allSuites.filter( suite => suite.config.skip ).length;

			strs.push( [
				`Suites: ${chalk.green( `${passingSuites} passed` )}`,
				failingSuites && chalk.red( `${failingSuites} failed` ),
				skippedSuites && chalk.yellow( `${skippedSuites} skipped` )
			].filter( Boolean ).join( ", " ) );

		}

		const failingTests = this.tests.filter( tests => tests.fail );
		{

			const passingTests = this.tests.filter( tests => tests.pass ).length;
			const skippedTests = this.tests.filter( tests => tests.config.skip ).length;

			strs.push( [
				`Tests:  ${chalk.green( `${passingTests} passed` )}`,
				failingTests.length && chalk.red( `${failingTests.length} failed` ),
				skippedTests && chalk.yellow( `${skippedTests} skipped` )
			].filter( Boolean ).join( ", " ) );

		}

		strs.push( chalk.gray( `Total duration: ${this.duration.toFixed( 2 )}ms` ) );

		if ( this.rawConfig.failingTests && this.fail ) {

			strs.push( "" );
			strs.push( "Focus on failing tests:" );
			this.suites.filter( suite => suite.fail ).forEach( suite => {

				const base = `vt ${suite.name}`;
				if ( suite.failingTests.length )
					strs.push( `${base} ${suite.failingTests.map( test =>
						`-t ${test.fullName.slice( suite.name.length + 1 )}` ).join( " " )}` );
				else
					strs.push( base );

			} );

		}

		return strs.join( "\n" );

	}

	print( fullPrint = true ) {

		console.log( this.toString( fullPrint ) );

	}

}
