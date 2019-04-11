
import chalk from "chalk";

import Node from "./Node.mjs";
import Test from "./Test.mjs";
import { time, timeout } from "./util.mjs";

const getCallerLine = () => {

	try {

		throw new Error();

	} catch ( e ) {

		const simple = e.stack.match( /\[as callback\].*:([0-9]+):[0-9]+/ );
		if ( simple && simple[ 1 ] ) return parseInt( simple[ 1 ] );

		return NaN;

		// TODO: Replace simple above with complex below
		// const stackLines = e.stack.split( "\n" ).slice( 1 );
		// const stackLine = stackLines.find( s =>
		// 	s.startsWith( "    at " ) && ! s.includes( "verit-test/src" ) );
		// const parts = stackLine.split( ":" );
		// const line = parseInt( parts[ parts.length - 2 ] );
		// if ( line ) return line;

	}

};

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

			config.skip = true;
			return this.it( name, config, callback );

		};

	}

	describe( name, config, callback ) {

		if ( typeof config === "function" )
			callback = config;

		const suite = new Suite( name, config, this );

		this.add( suite );

		if ( callback )
			try {

				callback( suite );

			} catch ( err ) {

				suite.tests.forEach( test => {

					test.err = err;
					test.config.skip = true;

				} );
				suite.err = err;

			}

		return suite;

	}

	it( name, config, callback ) {

		if ( typeof config === "function" ) {

			callback = config;
			config = {};

		}

		if ( this.config.line && ! this.config.line.includes( getCallerLine() ) )
			config.skip = true;

		const test = new Test( name, config, callback, this );

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

	async run( exit = true ) {

		if ( this.config.skip ) return;

		this.start = time();

		try {

			for ( let i = 0; i < this.befores.length; i ++ )
				if ( this.befores[ i ].constructor.name === "AsyncFunction" )
					await this.befores[ i ]( this );
				else
					this.befores[ i ]( this );

		} catch ( err ) {

			this.err = err;
			this.tests.forEach( test => test.err = err );

			this.end = time();

			if ( exit && ! this.parent )
				process.exit( this.pass ? 0 : 1 );

			return;

		}

		// TODO: parallel should be either a boolean or Node
		// If a node, the test should run in sync under that node
		// A false value on a test indicates the suite; a suite indicates itself
		// TODO: pipe stdout and stderr into the test
		if ( this.config.parallel ) {

			const promises = Promise.all( this.childrenArr.map( node => node.run() ) );
			if ( this._timeout ) await timeout( promises, this._timeout );
			else await promises;

		} else

			for ( let i = 0; i < this.childrenArr.length; i ++ )
				if ( this._timeout )
					await timeout( this.childrenArr[ i ].run(), this._timeout );
				else
					await this.childrenArr[ i ].run();

		try {

			for ( let i = 0; i < this.afters.length; i ++ )
				if ( this.afters[ i ].constructor.name === "AsyncFunction" )
					await this.afters[ i ]( this );
				else
					this.afters[ i ]( this );

		} catch ( err ) {

			this.err = err;
			this.tests.forEach( test => test.err = err );

		}

		this.end = time();

		if ( exit && ! this.parent )
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
		if ( this.skippedTests.length ) console.log( this.skippedTests );
		return this.skippedTests;

	}

	get tests() {

		Object.defineProperty( this, "tests", {
			value: [].concat( ...this.childrenArr.map( node => node instanceof Suite ? node.tests : node ) )
		} );
		return this.tests;

	}

	toString( recurse = true ) {

		const skipped = this.tests.length === this.skippedTests.length;

		const color = this.fail && "red" ||
			skipped && "yellow" ||
			"green";

		return [
			[
				"  ".repeat( this.level ),
				chalk[ color ]( this.name ),
				" ",
				skipped ? "" :
					`[${this.passingTests.length}/${this.tests.length - this.skippedTests.length}] `,
				chalk.gray( `(${this.duration.toFixed( 2 )}ms)` )
			].join( "" ),
			...this.err ? [ chalk.red( this.err.stack ) ] : [],
			...recurse && ! skipped ? this.childrenArr.map( String ) : []
		].join( "\n" );

	}

}

Suite.parallel = true;
Suite.mochaDone = false;
