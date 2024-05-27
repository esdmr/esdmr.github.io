function interpolate(t: number, a: number, b: number) {
	return (1 - t) * a + t * b;
}

class Property {
	original: number;
	final: number;

	constructor(value: number) {
		this.original = value;
		this.final = value;
	}

	commit(t: number) {
		this.original = this.getValue(t);
	}

	getValue(t: number) {
		return interpolate(t, this.original, this.final);
	}
}

class Object3d {
	flipY = new Property(0);
	rotationX = new Property(0);
	rotationY = new Property(0);
	rotationAngle = new Property(0);
	scaleX = new Property(1);
	scaleY = new Property(1);

	startTime: DOMHighResTimeStamp = 0;
	duration = 0;

	constructor(public readonly element: HTMLElement) {}

	commit(now: DOMHighResTimeStamp) {
		const passedDuration = now - this.startTime;

		if (this.duration < passedDuration) {
			this.flipY.commit(1);
			this.rotationX.commit(1);
			this.rotationY.commit(1);
			this.rotationAngle.commit(1);
			this.scaleX.commit(1);
			this.scaleY.commit(1);
			this.startTime = now;
			this.duration = 0;
		} else {
			const t = passedDuration / this.duration;

			this.flipY.commit(t);
			this.rotationX.commit(t);
			this.rotationY.commit(t);
			this.rotationAngle.commit(t);
			this.scaleX.commit(t);
			this.scaleY.commit(t);
			this.startTime = now;
			this.duration -= passedDuration;
		}
	}

	// eslint-disable-next-line max-params
	transform(
		flipAngle: number,
		rotationX: number,
		rotationY: number,
		rotationAngle: number,
		scaleX: number,
		scaleY: number,
		duration: number,
	) {
		const now = performance.now();
		this.commit(now);

		this.flipY.final = flipAngle;
		this.rotationX.final = rotationX;
		this.rotationY.final = rotationY;
		this.rotationAngle.final = rotationAngle;
		this.scaleX.final = scaleX;
		this.scaleY.final = scaleY;
		this.startTime = now;
		this.duration = duration;
	}

	renderAt(t: number) {
		const rotateY = `rotateY(${this.flipY.getValue(t)}deg)`;
		const rotate3d = `rotate3d(${this.rotationX.getValue(t)}, ${this.rotationY.getValue(t)}, 1, ${this.rotationAngle.getValue(t)}deg)`;
		const scale3d = `scale3d(${this.scaleX.getValue(t)}, ${this.scaleY.getValue(t)}, 1)`;
		this.element.style.transform = `${rotateY} ${rotate3d} ${scale3d}`;
	}

	render(now: DOMHighResTimeStamp) {
		const passedDuration = now - this.startTime;
		const t = passedDuration / this.duration;

		if (this.duration >= passedDuration) {
			this.renderAt(t);
			return true;
		}

		this.flipY.final %= 360;
		this.commit(now);
		this.renderAt(1);
		this.handleQueuedEvents();
		return false;
	}

	handleQueuedEvents() {
		// Do nothing.
	}
}

const maxNormalRotation = 22.5;
const extraButtonDownRotation = 5;
const buttonDownScale = 0.995;
const activeHorizontalMargin = 40;
const activeVerticalMargin = 4;
const activeDuration = 100;
const passiveDuration = 1000;
const flipDuration = 200;

class Card extends Object3d {
	isActive = false;
	isHeld = false;
	isFlipped = false;
	preemptive = true;
	queuedPointerEvent: PointerEvent | undefined;

	override handleQueuedEvents() {
		this.preemptive = true;

		if (this.queuedPointerEvent) {
			this.handlePointerIn(this.queuedPointerEvent);
			this.queuedPointerEvent = undefined;
		}
	}

	handlePointerIn(event: PointerEvent) {
		if (!this.preemptive) {
			this.queuedPointerEvent = event;
			return;
		}

		const elementBounds = this.element.getBoundingClientRect();
		const horizontalMargin = this.isActive ? activeHorizontalMargin : 0;
		const verticalMargin = this.isActive ? activeVerticalMargin : 0;
		const {pageX, pageY, buttons} = event;

		if (
			pageX < elementBounds.left - horizontalMargin ||
			pageX > elementBounds.right + horizontalMargin ||
			pageY < elementBounds.top - verticalMargin ||
			pageY > elementBounds.bottom + verticalMargin
		) {
			this.handlePointerOut();
			return;
		}

		let duration = this.isActive ? activeDuration : passiveDuration;
		this.isActive = true;

		const radius = Math.hypot(elementBounds.width, elementBounds.height) / 2;
		const xAxis = pageX - elementBounds.left - elementBounds.width / 2;
		const yAxis = pageY - elementBounds.top - elementBounds.height / 2;
		const distribution = Math.hypot(xAxis, yAxis);
		const buttonClicked = buttons !== 0;
		const rotationDegrees =
			(distribution / radius) * maxNormalRotation +
			(buttonClicked ? extraButtonDownRotation : 0);

		const shouldFlip =
			!buttonClicked &&
			this.isHeld &&
			!(event.target instanceof HTMLAnchorElement && event.target.href);

		let flipAngle = this.flipY.final;

		if (shouldFlip) {
			this.isFlipped = !this.isFlipped;
			flipAngle += xAxis >= 0 ? 180 : -180;
			this.preemptive = false;
			duration = flipDuration;
		}

		this.isHeld = buttonClicked;

		this.transform(
			flipAngle,
			this.isFlipped ? yAxis : -yAxis,
			xAxis,
			rotationDegrees,
			buttonClicked ? buttonDownScale : 1,
			buttonClicked ? buttonDownScale : 1,
			duration,
		);
	}

	handlePointerOut() {
		this.transform(
			0,
			0,
			0,
			0,
			1,
			1,
			this.isFlipped ? flipDuration : activeDuration,
		);
		this.isActive = false;
		this.isHeld = false;
		this.isFlipped = false;
		this.preemptive = true;
	}
}

export function setup() {
	const cards = Array.from(
		document.querySelectorAll<HTMLElement>('.--js-rot3d'),
		(i) => new Card(i),
	);

	document.body.addEventListener('pointerdown', (event) => {
		if (rafId === undefined) {
			rafId = requestAnimationFrame(render);
		}

		for (const card of cards) {
			card.handlePointerIn(event);
		}
	});

	document.body.addEventListener('pointerup', (event) => {
		if (rafId === undefined) {
			rafId = requestAnimationFrame(render);
		}

		for (const card of cards) {
			card.handlePointerIn(event);
		}
	});

	document.body.addEventListener('pointermove', (event) => {
		if (rafId === undefined) {
			rafId = requestAnimationFrame(render);
		}

		for (const card of cards) {
			card.handlePointerIn(event);
		}
	});

	document.body.addEventListener('pointerout', ({target}) => {
		if (rafId === undefined) {
			rafId = requestAnimationFrame(render);
		}

		for (const card of cards) {
			if (target === card.element) {
				card.handlePointerOut();
			}
		}
	});

	let rafId: number | undefined = requestAnimationFrame(render);

	function render(now: DOMHighResTimeStamp) {
		let anythingChanged = false;

		for (const card of cards) {
			anythingChanged ||= card.render(now);
		}

		rafId = anythingChanged ? requestAnimationFrame(render) : undefined;
	}
}
