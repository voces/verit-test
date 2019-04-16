#!/bin/sh
":" //# comment; exec /usr/bin/env node --experimental-modules --no-warnings "$0" "$@"

import { spawn } from "child_process";
import path from "path";
import process from "process";
import unparse from "yargs-unparser";

import args from "./args.mjs";

const __dirname = path.dirname( new URL( import.meta.url ).pathname );

const objFilter = ( obj, cb ) => {

	const newObj = {};
	for ( const prop in obj )
		if ( cb( obj[ prop ], prop ) ) newObj[ prop ] = obj[ prop ];
	return newObj;

};

const nodeArgs = objFilter( args, ( _, key ) => process.allowedNodeEnvironmentFlags.has( key ) );
const vtArgs = objFilter( args, ( _, key ) => ! process.allowedNodeEnvironmentFlags.has( key ) );

// We default these to true
if ( nodeArgs[ "experimental-modules" ] === undefined ) nodeArgs[ "experimental-modules" ] = true;
if ( nodeArgs[ "no-warnings" ] === undefined ) nodeArgs[ "no-warnings" ] = true;

const finalArgs = [
	...unparse( nodeArgs ),
	path.join( __dirname, "_vt.mjs" ),
	...args._,
	...unparse( vtArgs )
];

const proc = spawn( process.execPath, finalArgs, {
	stdio: "inherit"
} );

proc.on( "exit", ( code, signal ) =>
	process.on( "exit", () => {

		if ( signal ) process.kill( process.pid, signal );
		else process.exit( code );

	} ) );

// terminate children
process.on( "SIGINT", () => {

	proc.kill( "SIGINT" );
	proc.kill( "SIGTERM" );

} );
