
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
				await beforeEaches[ i ]( this );

			if ( this.config.mochaDone && this.callback.length > 0 )
				await new Promise( resolve => this.callback( resolve, this ) );
			else
				await this.callback( this );

			const afterEaches = this.allAfterEaches();
			for ( let i = 0; i < afterEaches.length; i ++ )
				await afterEaches[ i ]( this );

		} catch ( err ) {

			this.err = err;

		}

		this.end = time();

	}

	get pass() {

		Object.defineProperty( this, "pass", { value: ! this.err } );
		return this.pass;

	}

	toString() {

		if ( this.config.skip )
			return [
				"  ".repeat( this.level ),
				chalk.yellow( "☐" ),
				" ",
				this.name
			].join( "" );

		return [
			[
				"  ".repeat( this.level ),
				this.pass ? chalk.green( "✓" ) : chalk.red( "✗" ),
				" ",
				this.name,
				" ",
				chalk.gray( `(${this.duration.toFixed( 2 )}ms)` )
			].join( "" ),
			...this.err ? [ chalk.red( this.err.stack ), "" ] : []
		].filter( Boolean ).join( "\n" );

	}

}
