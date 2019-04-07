
import Runner from "./src/Runner.mjs";

const runner = new Runner();

const installGlobals = () => {

	global.it = it;
	global.describe = describe;
	global.before = before;
	global.beforeEach = beforeEach;
	global.after = after;
	global.afterEach = afterEach;

};

export default async config => {

	if ( config ) {

		runner.config( config );
		if ( config.globals !== false )
			installGlobals();

	} else installGlobals();

	await runner.run( true );

};

export const it = runner.it;
export const describe = runner.describe;
export const before = runner.before;
export const beforeEach = runner.beforeEach;
export const after = runner.after;
export const afterEach = runner.afterEach;
