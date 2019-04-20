
import yargs from "yargs";

const parser = yargs
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
	} )
	.option( "test-name-filter", {
		alias: [ "t", "n" ],
		describe: "Test full name must match pattern",
		string: true,
		array: true
	} )
	.option( "failing-tests", {
		describe: "Print shortcuts to run fiaing tests",
		boolean: true,
		default: true
	} );

export default parser.argv;

export const alias = parser.getOptions().alias;
