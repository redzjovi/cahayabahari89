export type PreviewItem = { src: string; alt: string };

/** Global image preview (lightbox). Any thumbnail calls `preview.open(url, label)`
 * or `preview.openList(images, index)` for galleries with prev/next navigation.
 * A single host in the root layout renders it. */
class PreviewStore {
	items = $state<PreviewItem[]>([]);
	index = $state(0);

	current = $derived(this.items[this.index] ?? null);
	total = $derived(this.items.length);

	open(src: string, alt = '') {
		this.items = [{ src, alt }];
		this.index = 0;
	}

	openList(images: PreviewItem[], startIndex = 0) {
		if (!images.length) return;
		this.items = images.map((i) => ({ ...i }));
		this.index = Math.min(Math.max(startIndex, 0), images.length - 1);
	}

	next() {
		if (this.items.length < 2) return;
		this.index = (this.index + 1) % this.items.length;
	}

	prev() {
		if (this.items.length < 2) return;
		this.index = (this.index - 1 + this.items.length) % this.items.length;
	}

	close() {
		this.items = [];
		this.index = 0;
	}
}

export const preview = new PreviewStore();
