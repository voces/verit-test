
export const clock = () =>
	Number( process.hrtime.bigint() ) / 1000000;

export const time = async ( cb, ...args ) => {

	const start = clock();

	const result =
		cb instanceof Promise ? await cb :
			cb.constructor.name === "AsyncFunction" ? await cb( ...args ) :
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
export const timeout = function ( promise, ms, string ) {

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
