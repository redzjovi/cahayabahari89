<script lang="ts">
	import { t, locale } from '$lib/locale.svelte';
	import { localize } from '$lib/routes';
	import { adminSession } from '$lib/admin-session.svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	type CatRow = { id: number; slug: string; name: string };

	let cats = $state<CatRow[]>([]);
	let error = $state('');
	let ready = $state(false);

	let fSlug = $state('');
	let fSku = $state('');
	let fName = $state('');
	let fDesc = $state('');
	let fPrice = $state('');
	let fCat = $state('');
	let fStatus = $state('active');

	const canView = $derived(adminSession.can('products.write'));

	onMount(async () => {
		adminSession.init();
		if (!(await adminSession.refresh())) return;
		if (!canView) return;
		try {
			const res = await adminSession.api('/api/categories');
			if (res.ok) cats = (await res.json()) as CatRow[];
		} catch {
			// categories optional for the form
		}
		ready = true;
	});

	function apiError(json: unknown): string {
		const e = (json as { error?: string }).error ?? '';
		if (e.includes('already exists')) return t().admin.duplicate;
		if (e.includes('unknown')) return t().admin.unknownRef;
		return e || t().admin.loadFail;
	}

	async function save(e: SubmitEvent) {
		e.preventDefault();
		error = '';
		const payload: Record<string, unknown> = {
			slug: fSlug.trim(),
			name: fName,
			description: fDesc || undefined,
			price: Number(fPrice),
			categoryId: fCat === '' ? null : Number(fCat),
			status: fStatus
		};
		if (fSku.trim() !== '') payload.sku = fSku.trim();
		try {
			const res = await adminSession.api('/api/admin/products', { method: 'POST', body: JSON.stringify(payload) });
			if (!res.ok) {
				error = apiError(await res.json());
				return;
			}
			await goto(localize('/admin/products', locale.current));
		} catch {
			error = t().admin.loadFail;
		}
	}
</script>

<svelte:head><title>{t().admin.newProduct} — Admin</title></svelte:head>

<section class="content-wrap max-w-3xl py-10">
	<a href={localize('/admin/products', locale.current)} class="text-sm font-semibold text-muted underline hover:text-ink">&larr; {t().admin.productsTitle}</a>
	<h1 class="mt-3 font-display text-3xl font-bold">{t().admin.newProduct}</h1>

	{#if !canView && ready}
		<p class="mt-6 rounded-card border border-line p-6 text-muted">{t().admin.noAccess}</p>
	{:else}
		{#if error}<p class="mt-4 rounded-lg bg-red-500/10 p-3 text-sm font-medium text-red-500">{error}</p>{/if}
		<form onsubmit={save} class="mt-6 grid gap-4 rounded-card border border-line bg-surface p-6 shadow-card sm:grid-cols-2">
			<label class="grid gap-1.5 text-sm font-semibold">slug<input bind:value={fSlug} required minlength="2" class="rounded-lg border px-4 py-2.5 font-mono font-normal" /></label>
			<label class="grid gap-1.5 text-sm font-semibold">{t().admin.productName}<input bind:value={fName} required minlength="2" class="rounded-lg border px-4 py-2.5 font-normal" /></label>
			<label class="grid gap-1.5 text-sm font-semibold">{t().admin.sku}<input bind:value={fSku} class="rounded-lg border px-4 py-2.5 font-normal" /></label>
			<label class="grid gap-1.5 text-sm font-semibold">{t().admin.priceIdr}<input type="number" bind:value={fPrice} required min="0" step="1000" class="rounded-lg border px-4 py-2.5 font-normal" /></label>
			<label class="grid gap-1.5 text-sm font-semibold">{t().admin.categoryCol}
				<select bind:value={fCat} class="rounded-lg border px-4 py-2.5 font-normal">
					<option value="">—</option>
					{#each cats as c}<option value={String(c.id)}>{c.name}</option>{/each}
				</select>
			</label>
			<label class="grid gap-1.5 text-sm font-semibold">{t().admin.statusCol}
				<select bind:value={fStatus} class="rounded-lg border px-4 py-2.5 font-normal">
					<option value="active">{t().admin.active}</option>
					<option value="draft">{t().admin.draft}</option>
				</select>
			</label>
			<label class="grid gap-1.5 text-sm font-semibold sm:col-span-2">{t().admin.description}<textarea bind:value={fDesc} rows="3" class="rounded-lg border px-4 py-2.5 font-normal"></textarea></label>
			<div class="flex gap-2 sm:col-span-2">
				<button type="submit" class="rounded-full bg-brand px-5 py-2 font-bold text-brand-ink">{t().admin.create}</button>
				<a href={localize('/admin/products', locale.current)} class="rounded-full border border-line px-5 py-2 text-sm font-bold">{t().admin.cancel}</a>
			</div>
		</form>
	{/if}
</section>
