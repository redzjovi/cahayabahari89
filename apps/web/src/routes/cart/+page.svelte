<script lang="ts">
	import { t, locale } from '$lib/locale.svelte';
	import { localize } from '$lib/routes';
	import { cart, cartTotal, buildCartWhatsAppLink } from '$lib/cart.svelte';
	import PhotoPlaceholder from '$lib/components/PhotoPlaceholder.svelte';
	import SectionHead from '$lib/components/SectionHead.svelte';

	let { data } = $props();
	let selected = $state(new Set<string>());

	function idr(n: number) {
		return n.toLocaleString(locale.current === 'id' ? 'id-ID' : 'en-US');
	}

	function toggle(slug: string) {
		const next = new Set(selected);
		if (next.has(slug)) next.delete(slug);
		else next.add(slug);
		selected = next;
	}

	function toggleAll() {
		if (selected.size === $cart.length) {
			selected = new Set();
		} else {
			selected = new Set($cart.map((i) => i.slug));
		}
	}

	function deleteSelected() {
		for (const slug of selected) cart.removeAll(slug);
		selected = new Set();
	}

	const selectedItems = $derived($cart.filter((i) => selected.has(i.slug)));
	const selectedTotal = $derived(selectedItems.reduce((s, i) => s + i.price * i.qty, 0));
	const selectedQty = $derived(selectedItems.reduce((s, i) => s + i.qty, 0));
	const hasSelection = $derived(selected.size > 0);

	const waLink = $derived(
		hasSelection
			? buildCartWhatsAppLink(selectedItems, locale.current as 'en' | 'id')
			: buildCartWhatsAppLink($cart, locale.current as 'en' | 'id')
	);
</script>

<svelte:head>
	<title>{t().cart.title} — Cahaya Bahari 89</title>
</svelte:head>

<section class="content-wrap pb-6 pt-8">
	<SectionHead eyebrow={t().cart.title} title="" />

	{#if $cart.length > 0}
		<div class="mt-4 flex items-center gap-3 pl-4">
			<label class="flex cursor-pointer items-center gap-1.5 text-sm text-muted">
				<input type="checkbox" checked={selected.size === $cart.length && $cart.length > 0} onchange={toggleAll} class="mt-1 h-4 w-4 rounded border-line accent-brand" />
				All
			</label>
			{#if hasSelection}
				<button onclick={deleteSelected} class="rounded-full border border-red-300 px-4 py-2 text-sm font-bold text-red-500 transition hover:border-red-500 hover:bg-red-50">
					Delete ({selected.size})
				</button>
			{/if}
		</div>
	{/if}

	{#if $cart.length === 0}
		<div class="mt-8 rounded-card border border-dashed border-line p-12 text-center">
			<p class="text-sm text-muted md:text-lg">{t().cart.empty}</p>
			<a href={localize('/products', locale.current)} class="mt-4 inline-block rounded-full bg-brand px-6 py-3 text-sm font-bold text-brand-ink transition hover:brightness-110 md:text-base">
				{t().cart.backToCatalog}
			</a>
		</div>
	{:else}
		<div class="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
			<div class="flex flex-col gap-4">
				{#each $cart as item (item.slug)}
					<div class="flex gap-4 rounded-card border border-line bg-surface p-4 shadow-card">
						<div class="flex items-start gap-3">
							<input type="checkbox" checked={selected.has(item.slug)} onchange={() => toggle(item.slug)} class="mt-1 h-4 w-4 shrink-0 cursor-pointer rounded border-line accent-brand" />
							<div class="h-16 w-16 shrink-0 overflow-hidden rounded-lg md:h-24 md:w-24">
								{#if item.imageUrl}
									<img src={item.imageUrl} alt={item.name} class="h-full w-full object-cover" />
								{:else}
									<PhotoPlaceholder label={item.name} aspect="aspect-square" rounded={false} />
								{/if}
							</div>
						</div>
						<div class="flex flex-1 flex-col gap-2">
							<h3 class="font-display text-sm font-bold md:text-lg">{item.name}</h3>
							<div class="flex items-center justify-between gap-2">
								<p class="text-sm text-muted">Rp {idr(item.price)}</p>
								<div class="flex items-center gap-1 rounded-full border border-line">
									<button onclick={() => { if (item.qty === 1 && !confirm(t().cart.confirmRemove)) return; cart.remove(item.slug); }} class="px-2 py-0.5 text-xs font-bold text-muted transition hover:text-brand">−</button>
									<span class="min-w-[1.5rem] text-center text-xs font-bold">{item.qty}</span>
									<button onclick={() => cart.add({ slug: item.slug, name: item.name, price: item.price, imageUrl: item.imageUrl })} class="px-2 py-0.5 text-xs font-bold text-muted transition hover:text-brand">+</button>
								</div>
							</div>
						</div>
					</div>
				{/each}
			</div>

			<div class="h-fit rounded-card border border-line bg-surface p-4 shadow-card">
				<h2 class="font-display text-sm font-bold md:text-lg">{t().cart.orderViaWhatsApp}</h2>
				<div class="mt-4 flex flex-col gap-3">
					<div class="flex justify-between text-sm">
						<span class="text-muted">
							{t().cart.items}: {hasSelection ? selectedQty : $cart.reduce((s, i) => s + i.qty, 0)}
							{#if hasSelection}<span class="text-xs">(selected)</span>{/if}
						</span>
					</div>
					<div class="flex justify-between font-display text-base font-bold md:text-xl">
						<span>{t().cart.total}</span>
						<span class="text-brand">Rp {idr(hasSelection ? selectedTotal : $cartTotal)}</span>
					</div>
				</div>
				{#if hasSelection}
					<p class="mt-3 text-xs text-muted">Ordering {selected.size} selected item(s)</p>
				{/if}
				<a href={waLink} target="_blank" rel="noreferrer" class="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-brand px-4 py-3 font-bold text-brand-ink transition hover:brightness-110">
					<svg viewBox="0 0 24 24" class="h-4 w-4 md:h-5 md:w-5" fill="currentColor" aria-hidden="true">
						<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
					</svg>
					{t().cart.generateOrder}
				</a>
				<a href={localize('/products', locale.current)} class="mt-3 block text-center text-sm font-semibold text-muted underline hover:text-brand">
					← {t().cart.backToCatalog}
				</a>
			</div>
		</div>
	{/if}
</section>
