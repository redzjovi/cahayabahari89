<script lang="ts">
	import { t, locale } from '$lib/locale.svelte';
	import { localize } from '$lib/routes';
	import { adminSession } from '$lib/admin-session.svelte';
	import Field from '$lib/components/Field.svelte';
	import { slugify } from '$lib/slug';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	type CatRow = { id: number; slug: string; name: string };

	let cats = $state<CatRow[]>([]);
	let error = $state('');
	let ready = $state(false);

	let fSku = $state('');
	let fName = $state('');
	let fDesc = $state('');
	let fPrice = $state('');
	let fCat = $state('');
	let fStatus = $state('active');
	let pendingFiles = $state<File[]>([]);
	let createdSlug: string | null = $state(null);

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

	const slugPreview = $derived(slugify(fName));

	async function save(e: SubmitEvent) {
		e.preventDefault();
		error = '';
		if (!slugPreview) {
			error = t().admin.invalidName;
			return;
		}
		const payload: Record<string, unknown> = {
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
			const created = (await res.json()) as { slug: string };
			if (pendingFiles.length) {
				const form = new FormData();
				form.set('slug', created.slug);
				for (const f of pendingFiles) form.append('files[]', f);
				const up = await fetch('/api/admin/images', {
					method: 'POST',
					headers: { authorization: adminSession.authHeader() },
					body: form
				});
				if (!up.ok) {
					// Product exists — stay here with the error and a link onward.
					createdSlug = created.slug;
					error = t().admin.uploadPartial;
					return;
				}
				await goto(localize(`/admin/products/${created.slug}/edit`, locale.current));
				return;
			}
			await goto(localize('/admin/products', locale.current));
		} catch {
			error = t().admin.loadFail;
		}
	}

	function pickFiles(e: Event) {
		const input = e.target as HTMLInputElement;
		pendingFiles = input.files ? [...input.files] : [];
	}
</script>

<svelte:head><title>{t().admin.newProduct} — Admin</title></svelte:head>

<section class="content-wrap max-w-3xl py-10">
	<a href={localize('/admin/products', locale.current)} class="text-sm font-semibold text-muted underline hover:text-ink">&larr; {t().admin.productsTitle}</a>
	<h1 class="mt-3 font-display text-3xl font-bold">{t().admin.newProduct}</h1>

	{#if !canView && ready}
		<p class="mt-6 rounded-card border border-line p-6 text-muted">{t().admin.noAccess}</p>
	{:else}
		{#if error}
			<p class="mt-4 rounded-lg bg-red-500/10 p-3 text-sm font-medium text-red-500">
				{error}
				{#if createdSlug}
					<a href={localize(`/admin/products/${createdSlug}/edit`, locale.current)} class="ml-2 underline">{t().admin.editItem} →</a>
				{/if}
			</p>
		{/if}
		<form onsubmit={save} class="mt-6 grid gap-4 rounded-card border border-line bg-surface p-6 shadow-card">
			<Field label={t().admin.attachImages}>
				<span class="grid gap-1.5">
					<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple onchange={pickFiles} class="w-full text-sm font-normal" />
					{#if pendingFiles.length}
						<span class="text-xs font-normal text-muted">{pendingFiles.length} × {pendingFiles.map((f) => f.name).join(', ')}</span>
					{:else}
						<span class="text-xs font-normal text-muted">{t().admin.uploadHint}</span>
					{/if}
				</span>
			</Field>
			<Field label={t().admin.productName} required><input bind:value={fName} required minlength="2" class="w-full rounded-lg border px-4 py-2.5 font-normal" /></Field>
			<Field label="Slug" hint={t().admin.slugAutoNote}><span class="block w-full rounded-lg border border-line bg-band px-4 py-2.5 font-mono text-sm font-normal text-muted">{slugPreview || '—'}<span class="text-accent-strong">-id</span></span></Field>
			<Field label={t().admin.categoryCol}>
				<select bind:value={fCat} class="w-full rounded-lg border px-4 py-2.5 font-normal">
					<option value="">—</option>
					{#each cats as c}<option value={String(c.id)}>{c.name}</option>{/each}
				</select>
			</Field>
			<Field label={t().admin.description}><textarea bind:value={fDesc} rows="3" class="w-full rounded-lg border px-4 py-2.5 font-normal"></textarea></Field>
			<Field label={t().admin.priceIdr} required><input type="number" bind:value={fPrice} required min="0" step="1000" class="w-full rounded-lg border px-4 py-2.5 font-normal" /></Field>
			<Field label={t().admin.sku}><input bind:value={fSku} class="w-full rounded-lg border px-4 py-2.5 font-normal" /></Field>
			<Field label={t().admin.statusCol}>
				<select bind:value={fStatus} class="w-full rounded-lg border px-4 py-2.5 font-normal">
					<option value="active">{t().admin.active}</option>
					<option value="draft">{t().admin.draft}</option>
				</select>
			</Field>
			<div class="flex gap-2 sm:pl-[196px]">
				<button type="submit" class="rounded-full bg-brand px-5 py-2 font-bold text-brand-ink">{t().admin.create}</button>
				<a href={localize('/admin/products', locale.current)} class="rounded-full border border-line px-5 py-2 text-sm font-bold">{t().admin.cancel}</a>
			</div>
		</form>
	{/if}
</section>
