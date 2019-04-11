
export default class Node {

	constructor( name, config, parent ) {

		if ( config && config instanceof Node ) {

			parent = config;
			config = undefined;

		}

		this.name = name;
		this.parent = parent;
		this.rawConfig = config || {};

	}

	traverseUp( callback, acc ) {

		acc = callback( this, acc );
		let cur = this;
		while ( cur = cur.parent )
			acc = callback( cur, acc );

		return acc;

	}

	allBeforeEaches() {

		return this.traverseUp( ( node, beforeEaches ) =>
			[ ...node.beforeEaches || [], ...beforeEaches ]
		, [] );

	}

	allAfterEaches() {

		return this.traverseUp( ( node, afterEaches ) =>
			[ ...node.afterEaches || [], ...afterEaches ]
		, [] );

	}

	path( next ) {

		let str = this.name + ( next ? `/${next}` : "" );
		let cur = this;

		while ( cur = cur.parent )
			str = `${cur.name}/${str}`;

		return str;

	}

	get config() {

		const node = this;

		Object.defineProperty( this, "config", { value:
			new Proxy( this.rawConfig, {
				get( _, param ) {

					if ( node.rawConfig[ param ] !== undefined ) return node.rawConfig[ param ];
					if ( node.parent && node.parent.config[ param ] !== undefined ) return node.parent.config[ param ];
					return node.constructor[ param ];

				},
				set( _, param, value ) {

					node.rawConfig[ param ] = value;
					return true;

				}
			} )
		} );

		return this.config;

	}

	get level() {

		let level = 0;
		let cur = this;
		while ( cur = cur.parent ) level ++;

		Object.defineProperty( this, "level", { value: level } );
		return this.level;

	}

	get duration() {

		Object.defineProperty( this, "duration", { value: this.end - this.start } );
		return this.duration;

	}

	get fullName() {

		return this.traverseUp( ( node, name ) =>
			name ? `${node.name}/${name}` : node.name );

	}

	timeout( timeout ) {

		this._timeout = timeout;

	}

}
