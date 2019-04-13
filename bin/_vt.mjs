
import fs from "fs";

import vt from "../index.mjs";
import argv from "./args.mjs";

const { _: paths, $0, ...config } = argv;
if ( paths.length )

	if ( paths.length === 1 && fs.existsSync( paths[ 0 ] ) )
		config.files = paths;

	else
		config.glob = paths;

( async () => {

	await vt( config ).catch( err => {

		console.error( err );
		process.exit( 1 );

	} );

} )();
