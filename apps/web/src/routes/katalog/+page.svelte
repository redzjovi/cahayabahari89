<script lang="ts">
	let { data } = $props();
</script>

<svelte:head><title>Katalog — Cahaya Bahari 89</title></svelte:head>

<h1 class="text-2xl font-bold">Katalog</h1>
<p class="text-zinc-600">Showcase products from D1 via embedded Hono `GET /api/products`. {data.total} items.</p>

<form method="GET" class="mt-4 flex gap-2">
	<input name="q" value={data.q ?? ''} placeholder="Search..." class="rounded border px-3 py-2" />
	<input name="cat" value={data.cat ?? ''} placeholder="cat slug (e.g. marine)" class="rounded border px-3 py-2" />
	<button type="submit" class="rounded bg-black px-4 py-2 text-white">Filter</button>
</form>

{#if data.categories && (data.categories as any[]).length}
	<div class="mt-3 flex flex-wrap gap-2 text-sm">
		Categories:
		{#each data.categories as c}
			<a href="/katalog?cat={(c as any).slug}" class="rounded border px-2 py-1 hover:bg-zinc-50">{(c as any).name}</a>
		{/each}
	</div>
{/if}

{#if data.error}
	<p class="mt-4 rounded bg-amber-50 p-3 text-amber-700">{data.error} — run drizzle migrations to create tables.</p>
{/if}

<div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
	{#each data.products as p}
		<a href="/katalog/{(p as any).slug}" class="rounded border p-4 hover:shadow">
			<div class="aspect-video rounded bg-zinc-100 flex items-center justify-center text-xs text-zinc-500">
				{(p as any).image ? 'image' : 'no image'}
			</div>
			<h3 class="mt-2 font-semibold">{(p as any).name}</h3>
			<p class="text-sm text-zinc-600">Rp {((p as any).price/100).toLocaleString('id-ID')}</p>
		</a>
	{:else}
		<p class="text-zinc-500 col-span-3">No products yet. Seed via POST /api/admin/products with Bearer dev-token.</p>
	{/each}
</div>

{#if data.total > data.limit}
	<div class="mt-6 flex gap-2">
		{#if data.page > 1}<a href="/katalog?page={data.page-1}&q={data.q ?? ''}&cat={data.cat ?? ''}" class="rounded border px-3 py-1">Prev</a>{/if}
		<span class="px-3 py-1 text-sm">Page {data.page} of {Math.ceil(data.total / data.limit)}</span>
		{#if data.page * data.limit < data.total}<a href="/katalog?page={data.page+1}&q={data.q ?? ''}&cat={data.cat ?? ''}" class="rounded border px-3 py-1">Next</a>{/if}
	</div>
{/if}
