
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

// Turns an array of values into a memoized key
// E.g.: key( ...[ 1, 2, 3 ] ) === key( ...[ 1, 2, 3 ] )
const keyMemory = [];
export const key = ( ...args ) => {

	let memory = keyMemory[ args.length ] || ( keyMemory[ args.length ] = new WeakMap() );

	for ( let i = 0; i < args.length - 1; i ++ )
		if ( memory.has( args[ i ] ) ) memory = memory.get( args[ i ] );
		else {

			const innerMemory = new WeakMap();
			memory.set( args[ i ], innerMemory );
			memory = innerMemory;

		}

	const lastArg = args[ args.length - 1 ];

	if ( memory.has( lastArg ) )
		return memory.get( lastArg );

	const key = args;
	memory.set( lastArg, key );
	return key;

};

// Memoize a function across all of its args
export const memoize = ( fn, ...fixedArgs ) => {

	const memory = new WeakMap();
	let emptyValue;
	let emptyValueSet = false;

	// TODO: allow additional unmemoized args and overwriting
	return ( ...args ) => {

		if ( args.length === 0 ) {

			if ( emptyValueSet ) return emptyValue;
			emptyValue = fn( ...fixedArgs );
			emptyValueSet = true;
			return emptyValue;

		}

		const memoizeKey = key( args );

		if ( memory.has( memoizeKey ) ) return memory.get( memoizeKey );

		const value = fn( ...args, ...fixedArgs );
		memory.set( memoizeKey, value );
		return value;

	};

};
