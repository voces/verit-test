#!/bin/sh
":" //# comment; exec /usr/bin/env node --experimental-modules --no-warnings "$0" "$@"

// TODO: to allow node args, we should split the funcional part of this to _vt.mjs

import yargs from "yargs";
import fs from "fs";

import vt from "../index.mjs";

const argv = yargs
	.option( "mocha-done", {
		describe: "Use `done` callback argument",
		default: false,
		boolean: true
	} )
	.option( "parallel", {
		describe: "Whether the tests run in parallel",
		default: true,
		boolean: true
	} )
	.argv;

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
