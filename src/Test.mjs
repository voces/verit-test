
import chalk from "chalk";

import Node from "./Node.mjs";
import { clock, timeout } from "./util.mjs";

export default class Test extends Node {

	constructor( name, config, callback, parent ) {

		if ( typeof config === "function" ) {

			parent = callback;
			callback = config;
			config = undefined;

		}

		super( name, config, parent );
		this.callback = callback;

	}

	// Wraps the actual running in a try/catch and handles timeouts
	async _run() {

		try {

			if ( this.callback.length > 0 )
				return await timeout(
					this.__run(),
					this.config.timeout,
					`Expected \`done\` to be called within ${this.config.timeout}ms`
				);

			if ( this.config.timeout )
				return await timeout( this.__run(), this.config.timeout );

			return await this.__run();

		} catch ( err ) {

			this.err = err;

		}

	}

	async __run() {

		const beforeEaches = this.allBeforeEaches();
		for ( let i = 0; i < beforeEaches.length; i ++ )
			if ( beforeEaches[ i ].constructor.name === "AsyncFunction" )
				await beforeEaches[ i ]( this );
			else
				beforeEaches[ i ]( this );

		// We can shave off awaiting if the test has no params
		if ( this.callback.length > 0 )
			await new Promise( resolve => this.callback(
				new Proxy( resolve, {
					apply: ( _0, _1, args ) => resolve( ...args ),
					get: ( _0, prop ) => this[ prop ],
					set: ( _0, prop, value ) => this[ prop ] = value
				} )
			) );
		else if ( this.callback.constructor.name === "AsyncFunction" )
			await this.callback();
		else this.callback();

		const afterEaches = this.allAfterEaches();
		for ( let i = 0; i < afterEaches.length; i ++ )
			if ( afterEaches[ i ].constructor.name === "AsyncFunction" )
				await afterEaches[ i ]( this );
			else
				afterEaches[ i ]( this );

	}

	// TODO: we should only await async functions/explicit parallel
	async run() {

		if ( this.config.skip ) return;

		this.start = clock();
		await this._run();
		this.end = clock();

	}

	get fail() {

		Object.defineProperty( this, "fail", { value: !! this.err } );
		return this.fail;

	}

	get pass() {

		Object.defineProperty( this, "pass", { value: ! this.err && ! this.config.skip } );
		return this.pass;

	}

	toString() {

		if ( this.err )
			return [
				[
					"  ".repeat( this.level ),
					chalk.red( "✗" ),
					" ",
					this.name,
					" ",
					chalk.gray( `(${this.duration.toFixed( 2 )}ms)` )
				].join( "" ),
				chalk.red( this.err.stack )
			].filter( Boolean ).join( "\n" );

		if ( this.config.skip )
			return [
				"  ".repeat( this.level ),
				chalk.yellow( "☐" ),
				" ",
				this.name
			].join( "" );

		return [
			"  ".repeat( this.level ),
			chalk.green( "✓" ),
			" ",
			this.name,
			" ",
			chalk.gray( `(${this.duration.toFixed( 2 )}ms)` )
		].join( "" );

	}

}

Test.timeout = 1500;
