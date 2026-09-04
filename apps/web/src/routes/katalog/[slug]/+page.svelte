<script lang="ts">
	let { data } = $props();
	const p = $derived(data.product as any);
</script>

<svelte:head>
	<title>{p.name} — Katalog Cahaya Bahari 89</title>
	<meta name="description" content={p.description ?? p.name} />
	<meta property="og:title" content={p.name} />
	<meta property="og:description" content={p.description ?? p.name} />
</svelte:head>

<a href="/katalog" class="text-sm underline text-zinc-600">&larr; Kembali ke katalog</a>
<h1 class="mt-2 text-3xl font-bold">{p.name}</h1>
<p class="text-zinc-600">SKU: {p.sku ?? '-'} • Rp {(p.price / 100).toLocaleString('id-ID')}</p>

{#if p.images?.length}
	<div class="mt-4 grid gap-2 sm:grid-cols-3">
		{#each p.images as img}
			<div class="aspect-video rounded bg-zinc-100 flex items-center justify-center text-xs text-zinc-500">
				{img.r2Key}
			</div>
		{/each}
	</div>
{:else}
	<div class="mt-4 aspect-video rounded bg-zinc-100 flex items-center justify-center text-sm text-zinc-500">
		No image yet (upload R2 key via admin API)
	</div>
{/if}

<p class="mt-4 max-w-2xl whitespace-pre-line text-zinc-800">{p.description ?? 'No description.'}</p>

{#if p.category}
	<p class="mt-4 text-sm">Kategori: <a href="/katalog?cat={p.category.slug}" class="underline">{p.category.name}</a></p>
{/if}

<div class="mt-6">
	<a href="/contact" class="rounded bg-black px-4 py-2 text-white">Tanya produk ini</a>
</div>
