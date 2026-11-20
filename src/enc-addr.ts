#!/usr/bin/env node

import { encoder, hashSteps, xor } from "./dec-addr.ts";

export async function setup(helpText: string, addressText: string) {
	const text = helpText?.replace(/\s+/g, " ") ?? "";
	let digested = await crypto.subtle.digest("SHA-512", encoder.encode(text));

	{
		const view = new Uint32Array(digested.byteLength / Uint32Array.BYTES_PER_ELEMENT + 1);

		for (let i = 0; i < hashSteps; i++) {
			view[0] = i;
			view.set(new Uint32Array(digested), 1);
			digested = await crypto.subtle.digest("SHA-512", view);
		}
	}

	const bytes = new Uint8Array(digested);

	const keyText = toHex(xor(encoder.encode(addressText), bytes)).replaceAll(/\s+/g, "");

	return keyText;
}

function toHex(text: Uint8Array) {
	return Array.from(text, (i) => i.toString(16).padStart(2, "0")).join("");
}

if (import.meta.main) {
	console.log(await setup(process.argv[3], process.argv[2]));
}
