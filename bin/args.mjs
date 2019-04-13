
import yargs from "yargs";

const parser = yargs
	.option( "mocha-done", {
		describe: "Use `done` callback argument",
		default: false,
		boolean: true
	} )
	.option( "parallel", {
		describe: "Option to run tests in parallel",
		default: true,
		boolean: true
	} )
	.option( "globals", {
		describe: "Option to attach global test helpers",
		default: false,
		boolean: true
	} )
	.option( "line", {
		alias: "l",
		describe: "Lines of tests and suites to run",
		number: true,
		array: true
	} );

export default parser.argv;
