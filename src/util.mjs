
export const clock = () =>
	Number( process.hrtime.bigint() ) / 1000000;

export const time = async ( cb, ...args ) => {

	const start = clock();

	const result =
		cb instanceof Promise ?
			await cb :
			cb.constructor.name === "AsyncFunction" ?
				await cb( ...args ) :
				cb( ...args );

	const end = clock();

	return {
		start,
		result,
		end,
		duration: end - start
	};

};

export const sleep = ms => new Promise( resolve => {

	const id = setTimeout( () => {

		clearTimeout( id );
		resolve();

	}, ms );

} );

// https://italonascimento.github.io/applying-a-timeout-to-your-promises/
export const timeout = ( promise, ms, string ) => {

	// Create a promise that rejects in <ms> milliseconds
	const timeout = sleep( ms ).then( () => {

		throw new Error( string || `Timed out after ${ms}ms.` );

	} );

	// Returns a race between our timeout and the passed in promise
	return Promise.race( [
		promise,
		timeout
	] );

};

class MixedMap {

	constructor() {

		this.map = new WeakMap();
		this.obj = {};

	}

	has( key ) {

		if ( typeof key === "object" ) return this.map.has( key );
		return key in this.obj;

	}

	get( key ) {

		if ( typeof key === "object" ) return this.map.get( key );
		return this.obj[ key ];

	}

	set( key, value ) {

		if ( typeof key === "object" ) return this.map.set( key, value );
		return this.obj[ key ] = value;

	}

}

// Turns an array of values into a memoized key; order matters
// E.g.: key( ...[ 1, 2, 3 ] ) === key( ...[ 1, 2, 3 ] )
const keyMemory = [];
const zeroKey = [];
let keyId = 0;
export const key = ( ...args ) => {

	if ( args.length === 0 ) return zeroKey;

	let memory = keyMemory[ args.length ] ||
		( keyMemory[ args.length ] = new MixedMap() );

	for ( let i = 0; i < args.length - 1; i ++ )
		if ( memory.has( args[ i ] ) ) memory = memory.get( args[ i ] );
		else {

			const innerMemory = new MixedMap();
			memory.set( args[ i ], innerMemory );
			memory = innerMemory;

		}

	const lastArg = args[ args.length - 1 ];

	if ( memory.has( lastArg ) )
		return memory.get( lastArg );

	args.___id = keyId ++;
	const key = Object.freeze( args );
	memory.set( lastArg, key );
	return key;

};

// Memoize a function across all of its args
export const memoize = ( fn, ...fixedArgs ) => {

	const memory = new WeakMap();
	let emptyValue;
	let emptyValueSet = false;

	return ( ...args ) => {

		if ( args.length === 0 ) {

			if ( emptyValueSet ) return emptyValue;
			emptyValue = fn( ...fixedArgs );
			emptyValueSet = true;
			return emptyValue;

		}

		const memoizeKey = key( ...args );

		if ( memory.has( memoizeKey ) ) return memory.get( memoizeKey );

		const value = fn( ...args, ...fixedArgs );
		memory.set( memoizeKey, value );
		return value;

	};

};
