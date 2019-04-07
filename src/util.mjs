
export const time = ( hrTime = process.hrtime() ) =>
	hrTime[ 0 ] * 1000 + hrTime[ 1 ] / 1000000;

// https://italonascimento.github.io/applying-a-timeout-to-your-promises/
export const timeout = function ( promise, ms ) {

	// Create a promise that rejects in <ms> milliseconds
	const timeout = new Promise( ( _, reject ) => {

		const id = setTimeout( () => {

			clearTimeout( id );
			reject( "Timed out after " + ms + "ms." );

		}, ms );

	} );

	// Returns a race between our timeout and the passed in promise
	return Promise.race( [
		promise,
		timeout
	] );

};
