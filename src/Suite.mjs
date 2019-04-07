
import chalk from "chalk";

import Node from "./Node.mjs";
import Test from "./Test.mjs";
import { time, timeout } from "./util.mjs";

export default class Suite extends Node {

	constructor( name, parent, config ) {

		super( name, parent, config );
		Object.defineProperties( this, {
			childrenMap: { value: {} },
			childrenArr: { value: [] }
		} );
		this.children = this.childrenArr; // For printing
		this.befores = [];
		this.afters = [];
		this.beforeEaches = [];
		this.afterEaches = [];

	}

	describe( name, config, callback ) {

		if ( typeof config === "function" )
			callback = config;

		const suite = new Suite( name, this, config );

		this.add( suite );

		if ( callback ) callback( suite );

		return suite;

	}

	it( name, config, callback ) {

		if ( typeof config === "function" )
			callback = config;

		const test = new Test( name, callback, this, config );

		this.add( test );

		return this;

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

	parallel( parallel = true ) {

		this.rawConfig.parallel = parallel;

	}

	add( node ) {

		if ( this.childrenMap[ node.name ] !== undefined )
			console.warn( `Rerwriting suite ${this.path( this, name )}` );

		this.childrenMap[ node.name ] = node;
		this.childrenArr.push( node );

		return node;

	}

	async run( exit = true ) {

		this.start = time();

		try {

			for ( let i = 0; i < this.befores.length; i ++ )
				await this.befores[ i ]( this );

		} catch ( err ) {

			// TODO: we should catch these on the suite instead
			throw err;

		}

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

	traverse( cb ) {

		cb( this );

		for ( const name in this.childrenMap ) {

			const node = this.childrenMap[ name ];

			if ( node instanceof Suite )
				node.traverse( cb );

		}

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

	get tests() {

		Object.defineProperty( this, "tests", {
			value: this.childrenArr.reduce( ( sum, node ) =>
				node instanceof Suite ? sum + node.tests : sum + 1, 0 )
		} );
		return this.tests;

	}

	toString() {

		return [
			[
				"  ".repeat( this.level ),
				chalk[ this.pass ? "green" : "red" ]( this.name ),
				" ",
				`[${this.passingTests}/${this.tests}]`,
				" ",
				chalk.gray( `(${this.duration.toFixed( 2 )}ms)` )
			].join( "" ),
			...this.childrenArr.map( String )
		].join( "\n" );

	}

}

Suite.parallel = true;
Suite.mochaDone = false;
