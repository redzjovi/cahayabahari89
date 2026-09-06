<script lang="ts">
	import { t, locale } from '$lib/locale.svelte';
	import { localize } from '$lib/routes';
	import { reveal } from '$lib/reveal';
	import PhotoPlaceholder from './PhotoPlaceholder.svelte';

	let { product, badge = false }: { product: any; badge?: boolean } = $props();

	function idr(n: number) {
		return n.toLocaleString(locale.current === 'id' ? 'id-ID' : 'en-US');
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
		<h3 class="font-display text-lg font-bold leading-snug group-hover:text-brand">{product.name}</h3>
		<p class="text-lg font-extrabold text-accent-strong">Rp {idr(product.price)}<span class="text-xs font-medium text-muted">{t().katalog.per}</span></p>
		{#if product.description}
			<p class="line-clamp-2 text-sm text-muted">{product.description}</p>
		{/if}
	</div>
</a>
