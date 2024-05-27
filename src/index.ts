import './index.css';
import * as rot3d from './rot3d.js';
import * as decAddr from './dec-addr.js';

try {
	rot3d.setup();
} catch (error) {
	console.error(error);
}

try {
	await decAddr.setup();
} catch (error) {
	console.error(error);
}
