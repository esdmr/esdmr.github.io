import * as decAddr from "./dec-addr.js";
import * as rot3d from "./rot3d.js";

try {
	rot3d.setup();
} catch (error) {
	console.error(error);
}

try {
	if (typeof requestIdleCallback === "function") {
		requestIdleCallback(decAddr.setup, { timeout: 5000 });
	} else {
		await decAddr.setup();
	}
} catch (error) {
	console.error(error);
}
