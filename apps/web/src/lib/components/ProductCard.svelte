<script lang="ts">
	import { t, locale } from '$lib/locale.svelte';
	import { localize } from '$lib/routes';
	import { reveal } from '$lib/reveal';
	import { cart } from '$lib/cart.svelte';
	import PhotoPlaceholder from './PhotoPlaceholder.svelte';

	let { product, badge = false }: { product: any; badge?: boolean } = $props();
	let justAdded = $state(false);

	function idr(n: number) {
		return n.toLocaleString(locale.current === 'id' ? 'id-ID' : 'en-US');
	}

	function addToCart(e: Event) {
		e.preventDefault();
		e.stopPropagation();
		cart.add({
			slug: product.slug,
			name: product.name,
			price: product.price,
			imageUrl: product.image?.url ?? ''
		});
		justAdded = true;
		setTimeout(() => (justAdded = false), 300);
	}
</script>

<a href={localize(`/products/${product.slug}`, locale.current)} use:reveal class="lift group flex flex-col overflow-hidden rounded-card border border-line bg-surface shadow-card transition">
	<div class="relative">
		{#if product.image?.url}
			<img src={product.image.url} alt={product.image.alt ?? product.name} class="aspect-[4/3] w-full object-cover" loading="lazy" />
		{:else}
			<PhotoPlaceholder label={product.name} aspect="aspect-[4/3]" rounded={false} />
		{/if}
		{#if badge}
			<span class="absolute left-3 top-3 rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-ink">{t().katalog.bestSeller}</span>
		{/if}
	</div>
	<div class="flex flex-1 flex-col gap-1 p-4">
		<h3 class="font-display text-sm font-bold leading-snug group-hover:text-brand md:text-lg">{product.name}</h3>
		<p class="text-sm font-extrabold text-accent-strong md:text-lg">Rp {idr(product.price)}</p>
		{#if product.description}
			<p class="line-clamp-2 text-sm text-muted">{product.description}</p>
		{/if}
		<button onclick={addToCart} class="mt-2 rounded-full bg-brand px-4 py-2 font-bold text-brand-ink text-sm transition hover:brightness-110 {justAdded ? 'animate-pop' : ''}">
			{t().cart.addToCart}
		</button>
	</div>
</a>
