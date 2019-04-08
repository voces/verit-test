
import glob from "fast-glob";
import path from "path";

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
			// TODO: catch errors here
			this.cur.callback( this.cur );
			this.cur = this.cur.parent;

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
			parallel: this.parallel
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
			await import( path.join( process.cwd(), files[ i ] ) ).catch( console.error );
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

	print() {

		for ( let i = 0; i < this.suites.length; i ++ )
			console.log( this.suites[ i ].toString() );

	}

}
