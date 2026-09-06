<script lang="ts">
	import { t, locale } from '$lib/locale.svelte';
	import { localize } from '$lib/routes';
	import { adminSession } from '$lib/admin-session.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';

	type CatRow = { id: number; slug: string; name: string };
	type ImgRow = { id: number; r2Key: string; alt: string | null; sort: number; url: string };

	const slug = $derived(page.params.slug as string);

	let cats = $state<CatRow[]>([]);
	let error = $state('');
	let loading = $state(true);
	let notFound = $state(false);

	let fSku = $state('');
	let fName = $state('');
	let fDesc = $state('');
	let fPrice = $state('');
	let fCat = $state('');
	let fStatus = $state('active');
	let editImages = $state<ImgRow[]>([]);
	let uploading = $state(false);

	const canView = $derived(adminSession.can('products.write'));

	async function load() {
		loading = true;
		error = '';
		notFound = false;
		try {
			const [pRes, cRes] = await Promise.all([
				adminSession.api(`/api/products/${slug}`),
				adminSession.api('/api/categories')
			]);
			if (!pRes.ok) {
				notFound = true;
				return;
			}
			if (!cRes.ok) throw new Error('load');
			const p = (await pRes.json()) as {
				sku: string | null; name: string; description: string | null; price: number;
				categoryId: number | null; status: string; images: ImgRow[];
			};
			fSku = p.sku ?? '';
			fName = p.name;
			fDesc = p.description ?? '';
			fPrice = String(p.price);
			fCat = p.categoryId === null ? '' : String(p.categoryId);
			fStatus = p.status;
			editImages = (p.images ?? []).map((i) => ({ ...i }));
			cats = (await cRes.json()) as CatRow[];
		} catch {
			error = t().admin.loadFail;
		} finally {
			loading = false;
		}
	}

	onMount(async () => {
		adminSession.init();
		if (!(await adminSession.refresh())) return;
		if (canView) await load();
		else loading = false;
	});

	function apiError(json: unknown): string {
		const e = (json as { error?: string }).error ?? '';
		if (e.includes('unknown')) return t().admin.unknownRef;
		return e || t().admin.loadFail;
	}

	async function save(e: SubmitEvent) {
		e.preventDefault();
		error = '';
		const payload: Record<string, unknown> = {
			name: fName,
			description: fDesc || undefined,
			price: Number(fPrice),
			categoryId: fCat === '' ? null : Number(fCat),
			status: fStatus
		};
		if (fSku.trim() !== '') payload.sku = fSku.trim();
		try {
			const res = await adminSession.api(`/api/admin/products/${slug}`, { method: 'PATCH', body: JSON.stringify(payload) });
			if (!res.ok) {
				error = apiError(await res.json());
				return;
			}
			await goto(localize('/admin/products', locale.current));
		} catch {
			error = t().admin.loadFail;
		}
	}

	async function uploadFiles(e: Event) {
		const input = e.target as HTMLInputElement;
		if (!input.files?.length) return;
		error = '';
		uploading = true;
		try {
			const form = new FormData();
			form.set('slug', slug);
			for (const f of input.files) form.append('files[]', f);
			const res = await fetch('/api/admin/images', {
				method: 'POST',
				headers: { authorization: adminSession.authHeader() },
				body: form
			});
			if (!res.ok) {
				error = apiError(await res.json().catch(() => ({})));
				return;
			}
			const rows = (await res.json()) as ImgRow[];
			editImages = [...editImages, ...rows];
		} catch {
			error = t().admin.loadFail;
		} finally {
			uploading = false;
			input.value = '';
		}
	}

	async function removeImage(id: number) {
		error = '';
		try {
			const res = await adminSession.api(`/api/admin/images/${id}`, { method: 'DELETE' });
			if (!res.ok) {
				error = apiError(await res.json());
				return;
			}
			editImages = editImages.filter((i) => i.id !== id);
		} catch {
			error = t().admin.loadFail;
		}
	}
</script>

<svelte:head><title>{t().admin.editItem}: {slug} — Admin</title></svelte:head>

<section class="content-wrap max-w-3xl py-10">
	<a href={localize('/admin/products', locale.current)} class="text-sm font-semibold text-muted underline hover:text-ink">&larr; {t().admin.productsTitle}</a>
	<h1 class="mt-3 font-display text-3xl font-bold">{t().admin.editItem}: {slug}</h1>

	{#if !canView}
		<p class="mt-6 rounded-card border border-line p-6 text-muted">{t().admin.noAccess}</p>
	{:else if loading}
		<p class="mt-6 text-muted">…</p>
	{:else if notFound}
		<p class="mt-6 rounded-card border border-line p-6 text-muted">404</p>
	{:else}
		{#if error}<p class="mt-4 rounded-lg bg-red-500/10 p-3 text-sm font-medium text-red-500">{error}</p>{/if}
		<form onsubmit={save} class="mt-6 grid gap-4 rounded-card border border-line bg-surface p-6 shadow-card sm:grid-cols-2">
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
			<fieldset class="grid gap-2 text-sm font-semibold sm:col-span-2">
				{t().admin.attachImages}
				<div class="flex flex-wrap gap-2">
					{#each editImages as img}
						<span class="relative inline-block overflow-hidden rounded-lg border border-line">
							{#if img.url}<img src={img.url} alt={img.alt ?? ''} class="h-16 w-20 object-cover" />{:else}<span class="flex h-16 w-20 items-center justify-center bg-accent-soft text-[10px] text-accent-strong">no url</span>{/if}
							<button type="button" onclick={() => removeImage(img.id)} aria-label={t().admin.removeImage} class="absolute right-1 top-1 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-bold text-white">×</button>
						</span>
					{/each}
				</div>
				<div class="flex flex-wrap items-center gap-2">
					<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple onchange={uploadFiles} class="text-sm font-normal" />
					<span class="text-xs font-normal text-muted">{t().admin.uploadHint}</span>
					{#if uploading}<span class="text-xs text-muted">…</span>{/if}
				</div>
			</fieldset>
			<div class="flex gap-2 sm:col-span-2">
				<button type="submit" class="rounded-full bg-brand px-5 py-2 font-bold text-brand-ink">{t().admin.save}</button>
				<a href={localize('/admin/products', locale.current)} class="rounded-full border border-line px-5 py-2 text-sm font-bold">{t().admin.cancel}</a>
			</div>
		</form>
	{/if}
</section>
