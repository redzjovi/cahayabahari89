import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';

export interface CartItem {
	slug: string;
	name: string;
	price: number;
	imageUrl: string;
	qty: number;
}

const STORAGE_KEY = 'cb89-cart';
const WA_NUMBER = '6287877118199';

function loadCart(): CartItem[] {
	if (!browser) return [];
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		return stored ? JSON.parse(stored) : [];
	} catch {
		return [];
	}
}

function saveCart(items: CartItem[]) {
	if (!browser) return;
	localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

const { subscribe, update } = writable<CartItem[]>(loadCart());

export const cart = {
	subscribe,
	add(product: Omit<CartItem, 'qty'>, qty = 1) {
		update((items) => {
			const existing = items.find((i) => i.slug === product.slug);
			if (existing) {
				existing.qty += qty;
			} else {
				items.push({ ...product, qty });
			}
			saveCart(items);
			return items;
		});
	},
	remove(slug: string) {
		update((items) => {
			const idx = items.findIndex((i) => i.slug === slug);
			if (idx !== -1) {
				if (items[idx].qty > 1) {
					items[idx].qty -= 1;
				} else {
					items.splice(idx, 1);
				}
				saveCart(items);
			}
			return items;
		});
	},
	removeAll(slug: string) {
		update((items) => {
			const filtered = items.filter((i) => i.slug !== slug);
			saveCart(filtered);
			return filtered;
		});
	},
	clear() {
		update(() => {
			saveCart([]);
			return [];
		});
	},
	getTotal() {
		let total = 0;
		subscribe((items) => { total = items.reduce((sum, i) => sum + i.price * i.qty, 0); })();
		return total;
	},
	getQty() {
		let qty = 0;
		subscribe((items) => { qty = items.reduce((sum, i) => sum + i.qty, 0); })();
		return qty;
	}
};

export const cartTotal = derived(cart, ($items) =>
	$items.reduce((sum, i) => sum + i.price * i.qty, 0)
);

export const cartQty = derived(cart, ($items) =>
	$items.reduce((sum, i) => sum + i.qty, 0)
);

function idr(n: number) {
	return n.toLocaleString('id-ID');
}

export function buildCartWhatsAppLink(items: CartItem[], locale: 'en' | 'id'): string {
	const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);
	let message: string;

	if (locale === 'id') {
		message = `Halo, saya ingin memesan barang berikut dari Cahaya Bahari 89:\n\n`;
		message += items.map((item, i) => `${i + 1}. ${item.name} - Rp ${idr(item.price)} x ${item.qty} kg`).join('\n');
		message += `\n\nTotal: Rp ${idr(total)}\n\nMohon konfirmasi ketersediaan dan pengiriman.`;
	} else {
		message = `Hello, I would like to order the following items from Cahaya Bahari 89:\n\n`;
		message += items.map((item, i) => `${i + 1}. ${item.name} - Rp ${idr(item.price)} x ${item.qty} kg`).join('\n');
		message += `\n\nTotal: Rp ${idr(total)}\n\nPlease confirm availability and delivery.`;
	}

	return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function buildSingleWhatsAppLink(productName: string, productSlug: string): string {
	const message = `Hello, I'm interested in ${productName} (${productSlug})`;
	return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;
}

export type InquiryFields = {
	name: string;
	company: string;
	email: string;
	volume: string;
	message: string;
};

export function buildInquiryWhatsAppLink(f: InquiryFields, locale: 'en' | 'id'): string {
	const lines = [
		f.company ? `${f.name} (${f.company})` : f.name,
		`Email: ${f.email}`,
		`${locale === 'id' ? 'Volume bulanan' : 'Monthly volume'}: ${f.volume}`
	];
	const head =
		locale === 'id'
			? `Halo Cahaya Bahari 89, saya ingin bertanya:\n\n`
			: `Hello Cahaya Bahari 89, I have an inquiry:\n\n`;
	const message = head + lines.join('\n') + `\n\n${f.message}`;
	return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;
}

export { WA_NUMBER };
