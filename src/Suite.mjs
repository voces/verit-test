
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

		// TODO: catch errors here
		if ( callback ) callback( suite );

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
				await this.befores[ i ]( this );

		} catch ( err ) {

			// TODO: we should catch these on the suite instead
			throw err;

		}

		// TODO: parallel should be either a boolean or Node
		// If a node, the test should run in sync under that node
		// A false value on a test indicates the suite; a suite indicates itself
		if ( this.config.parallel ) {

			const promises = Promise.all( this.childrenArr.map( node => node.run() ) );
			if ( this._timeout ) await timeout( promises, this._timeout );
			else await promises;

		} else

			for ( let i = 0; i < this.childrenArr.length; i ++ )
				if ( this._timeout ) await timeout( this.childrenArr[ i ].run(), this._timeout );
				else await this.childrenArr[ i ].run();

		try {

			for ( let i = 0; i < this.afters.length; i ++ )
				await this.afters[ i ]( this );

		} catch ( err ) {

			// TODO: we should catch these on the suite instead
			throw err;

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

	get pass() {

		Object.defineProperty( this, "pass", {
			value: this.childrenArr.every( node => node.pass )
		} );
		return this.pass;

	}

	get passingTests() {

		Object.defineProperty( this, "passingTests", {
			value: this.childrenArr.reduce( ( sum, node ) =>
				node instanceof Suite ? sum + node.passingTests : sum + node.pass, 0 )
		} );
		return this.passingTests;

	}

	get skippedTests() {

		Object.defineProperty( this, "skippedTests", {
			value: this.childrenArr.reduce( ( sum, node ) =>
				node instanceof Suite && sum + node.skippedTests ||
				node.config.skip && sum + 1 ||
				sum,
			0 )
		} );
		return this.skippedTests;

	}

	get tests() {

		Object.defineProperty( this, "tests", {
			value: this.childrenArr.reduce( ( sum, node ) =>
				node instanceof Suite && sum + node.tests ||
				sum + 1,
			0 )
		} );
		return this.tests;

	}

	toString() {

		const skipped = this.tests === this.skippedTests;

		const color = ! this.pass && "red" ||
			skipped && "yellow" ||
			"green";

		return [
			[
				"  ".repeat( this.level ),
				chalk[ color ]( this.name ),
				" ",
				skipped ? "" :
					`[${this.passingTests - this.skippedTests}/${this.tests - this.skippedTests}] `,
				chalk.gray( `(${this.duration.toFixed( 2 )}ms)` )
			].join( "" ),
			...this.skippedTests === this.tests ? [] : this.childrenArr.map( String )
		].join( "\n" );

	}

}

Suite.parallel = true;
Suite.mochaDone = false;
