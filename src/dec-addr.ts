const hashSteps = 0x40_00;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

export async function setup() {
	for (const element of document.querySelectorAll<HTMLAnchorElement>(
		'.--js-dec-addr',
	)) {
		const text = element.textContent?.replace(/\s+/g, ' ') ?? '';
		let digested = await crypto.subtle.digest('SHA-512', encoder.encode(text));

		{
			const view = new Uint32Array(
				digested.byteLength / Uint32Array.BYTES_PER_ELEMENT + 1,
			);

			for (let i = 0; i < hashSteps; i++) {
				view[0] = i;
				view.set(new Uint32Array(digested), 1);
				digested = await crypto.subtle.digest('SHA-512', view);
			}
		}

		const bytes = new Uint8Array(digested);

		const emailAddress = decoder
			.decode(xor(fromHex(element.dataset.addr ?? ''), bytes))
			.replaceAll(/\s+/g, '');
		element.href = '#';

		element.addEventListener('click', (event) => {
			event.preventDefault();
			globalThis.open(`mailto:${emailAddress}`);
		});
	}
}

function xor(target: Uint8Array, source: Uint8Array) {
	for (const index of target.keys()) {
		target[index] ^= source[index % source.length]; // eslint-disable-line no-bitwise
	}

	return target;
}

function fromHex(text: string) {
	return new Uint8Array(
		[...text.matchAll(/[\da-f]{2}/gi)].map((i) => Number.parseInt(i[0], 16)),
	);
}
