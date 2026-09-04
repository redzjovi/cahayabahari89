/** Scroll-reveal action: adds .is-visible when element enters viewport. CSS handles motion + reduced-motion. */
export function reveal(node: HTMLElement, threshold = 0.15) {
	if (typeof IntersectionObserver === 'undefined') {
		node.classList.add('is-visible');
		return {};
	}
	node.classList.add('reveal');
	const io = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (entry.isIntersecting) {
					entry.target.classList.add('is-visible');
					io.unobserve(entry.target);
				}
			}
		},
		{ threshold }
	);
	io.observe(node);
	return {
		destroy() {
			io.disconnect();
		}
	};
}
