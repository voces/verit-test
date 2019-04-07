
import chalk from "chalk";

import Node from "./Node.mjs";
import { time } from "./util.mjs";

export default class Test extends Node {

	constructor( name, callback, parent, config ) {

		super( name, parent, config );
		this.callback = callback;

	}

	async run() {

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

		return [
			[
				"  ".repeat( this.level ),
				chalk[ this.pass ? "green" : "red" ]( this.name ),
				" ",
				chalk.gray( `(${this.duration.toFixed( 2 )}ms)` )
			].join( "" ),
			this.err ? chalk.red( this.err.stack ) : false
		].filter( Boolean ).join( "\n" );

	}

}
