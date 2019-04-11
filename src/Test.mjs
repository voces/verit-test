
import chalk from "chalk";

import Node from "./Node.mjs";
import { time } from "./util.mjs";

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

	// TODO: we should only await async functions/explicit parallel
	async run() {

		if ( this.config.skip ) return;

		this.start = time();

		try {

			const beforeEaches = this.allBeforeEaches();
			for ( let i = 0; i < beforeEaches.length; i ++ )
				if ( beforeEaches[ i ].constructor.name === "AsyncFunction" )
					await beforeEaches[ i ]( this );
				else
					beforeEaches[ i ]( this );

			if ( this.config.mochaDone && this.callback.length > 0 )
				await new Promise( resolve => this.callback( resolve, this ) );
			else if ( this.callback.constructor.name === "AsyncFunction" )
				await this.callback( this );
			else this.callback( this );

			const afterEaches = this.allAfterEaches();
			for ( let i = 0; i < afterEaches.length; i ++ )
				if ( afterEaches[ i ].constructor.name === "AsyncFunction" )
					await afterEaches[ i ]( this );
				else
					afterEaches[ i ]( this );

		} catch ( err ) {

			this.err = err;

		}

		this.end = time();

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
