
import chalk from "chalk";

import Node from "./Node.mjs";
import Test from "./Test.mjs";
import { clock, memoize } from "./util.mjs";

const getCallerLine = () => {

	try {

		throw new Error();

	} catch ( e ) {

		const line = e.stack.split( "\n" ).slice( 1 ).find( line =>
			! line.includes( "verit-test/src" ) );
		if ( ! line ) return NaN;

		const match = line.match( /:(\d+):\d/ );
		if ( ! match ) return NaN;

		return parseInt( match[ 1 ] );

	}

};

const toRegExp = memoize( str => new RegExp( str ) );

export default class Suite extends Node {

	constructor( name, config, parent ) {

		super( name, config, parent );
		this.childrenMap = {};
		this.childrenArr = [];
		this.children = this.childrenMap; // For printing
		this.befores = [];
		this.afters = [];
		this.beforeEaches = [];
		this.afterEaches = [];

		this.it.skip = ( name, config, callback ) => {

			if ( typeof config === "function" ) {

				callback = config;
				config = {};

			}

			return this.it( name, { ...config, skip: true }, callback );

		};

	}

	describe( name, config, callback ) {

		if ( typeof config === "function" )
			callback = config;

		const lineHit = this.config.line && this.config.line.includes( getCallerLine() );

		const suite = new Suite(
			name,
			{ ...config, ...lineHit ? { lineHit } : null },
			this
		);

		this.add( suite );

		if ( callback )
			try {

				callback( suite );

			} catch ( err ) {

				suite.tests.forEach( test => test.err = err );
				suite.err = err;

			}

		return suite;

	}

	it( name, config, callback ) {

		if ( typeof config === "function" ) {

			callback = config;
			config = {};

		}

		const test = new Test( name, config, callback, this );
		test.line = getCallerLine();

		if ( ( this.config.line || this.config.testNameFilter ) && ! this.config.lineHit ) {

			let hit = false;

			if ( this.config.line && this.config.line.includes( test.line ) )
				hit = true;

			if ( ! hit && this.config.testNameFilter &&
				this.config.testNameFilter.some( str =>
					toRegExp( str ).test( test.fullName ) ) )

				hit = true;

			if ( ! hit )
				test.config.skip = true;

		}

		this.add( test );

		return test;

	}

	before( callback ) {

		this.befores.push( callback );

	}

	after( callback ) {

		this.afters.push( callback );

	}

	beforeEach( callback ) {

		this.beforeEaches.push( callback );

	}

	afterEach( callback ) {

		this.afterEaches.push( callback );

	}

	add( node ) {

		if ( this.childrenMap[ node.name ] !== undefined )
			throw new Error( `Rewriting suite ${node.fullName}` );

		this.childrenMap[ node.name ] = node;
		this.childrenArr.push( node );

		return node;

	}

	async _run() {

		try {

			return await this.__run();

		} catch ( err ) {

			this.err = err;
			this.tests.forEach( test => test.err = err );

		}

	}

	async __run() {

		for ( let i = 0; i < this.befores.length; i ++ )
			if ( this.befores[ i ].constructor.name === "AsyncFunction" )
				await this.befores[ i ]( this );
			else
				this.befores[ i ]( this );

		if ( this.config.parallel )
			await Promise.all( this.childrenArr.map( node => node.run() ) );

		else
			for ( let i = 0; i < this.childrenArr.length; i ++ )
				await this.childrenArr[ i ].run();

		for ( let i = 0; i < this.afters.length; i ++ )
			if ( this.afters[ i ].constructor.name === "AsyncFunction" )
				await this.afters[ i ]( this );
			else
				this.afters[ i ]( this );

	}

	async run( exit = true ) {

		if ( this.config.skip || this.err ) return;

		this.start = clock();
		await this._run( exit );
		this.end = clock();

		if ( exit && ( ! this.parent || this.err ) )
			process.exit( this.pass ? 0 : 1 );

	}

	traverse( cb, acc ) {

		acc = cb( this, acc );
		for ( const name in this.childrenMap ) {

			const node = this.childrenMap[ name ];

			if ( node instanceof Suite )
				acc = node.traverse( cb, acc );
			else
				acc = cb( node, acc );

		}

		return acc;

	}

	get fail() {

		Object.defineProperty( this, "fail", {
			value: this.err || this.childrenArr.some( node => node.fail )
		} );
		return this.fail;

	}

	get pass() {

		Object.defineProperty( this, "pass", {
			value: ! this.err && this.childrenArr.every( node => node.pass )
		} );
		return this.pass;

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
			value: [].concat( ...this.childrenArr.map( node => node instanceof Suite ? node.tests : node ) )
		} );
		return this.tests;

	}

	get suites() {

		Object.defineProperty( this, "suites", {
			value: [].concat( this, ...this.childrenArr.map( node => node instanceof Suite ? node.suites : [] ) )
		} );
		return this.suites;

	}

	toString( recurse = true ) {

		const skipped = this.config.skip ||
			this.tests.length === this.skippedTests.length;

		const color = this.fail && "red" ||
			skipped && "yellow" ||
			"green";

		const duration = skipped ? undefined : chalk.gray( `(${this.duration.toFixed( 2 )}ms)` );

		return [
			[
				"  ".repeat( this.level ),
				chalk[ color ]( this.name ),
				skipped ?
					"" :
					` [${this.passingTests.length}/${this.tests.length - this.skippedTests.length}] ${duration}`
			].join( "" ),
			...this.err ? [ chalk.red( this.err.stack ) ] : [],
			...recurse && ! skipped ? this.childrenArr.map( String ) : []
		].join( "\n" );

	}

}

Suite.parallel = true;
