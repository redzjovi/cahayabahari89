<script lang="ts">
	import { t, locale } from '$lib/locale.svelte';
	import { localize } from '$lib/routes';
	import { adminSession } from '$lib/admin-session.svelte';
	import Field from '$lib/components/Field.svelte';
	import AdminImageGrid from '$lib/components/AdminImageGrid.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount, onDestroy } from 'svelte';

	type CatRow = { id: number; slug: string; name: string };
	type ImgRow = { id: number; r2Key: string; alt: string | null; sort: number; url: string };
	type PendingFile = { file: File; url: string };

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
	let pending = $state<PendingFile[]>([]);
	let orderDirty = $state(false);
	let saving = $state<'idle' | 'product' | 'images'>('idle');
	const busy = $derived(saving !== 'idle');

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
			orderDirty = false;
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
		if (busy) return;
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
			saving = 'product';
			const res = await adminSession.api(`/api/admin/products/${slug}`, { method: 'PATCH', body: JSON.stringify(payload) });
			if (!res.ok) {
				error = apiError(await res.json());
				return;
			}
			const updated = (await res.json()) as { slug: string };
			if (orderDirty && editImages.length > 1) {
				saving = 'images';
				const re = await adminSession.api('/api/admin/images/reorder', {
					method: 'PATCH',
					body: JSON.stringify({ slug: updated.slug, orderedIds: editImages.map((i) => i.id) })
				});
				if (!re.ok) {
					error = t().admin.reorderFailed;
					return;
				}
				orderDirty = false;
			}
			if (pending.length) {
				saving = 'images';
				const form = new FormData();
				form.set('slug', updated.slug);
				for (const p of pending) form.append('files[]', p.file);
				const up = await fetch('/api/admin/images', {
					method: 'POST',
					headers: { authorization: adminSession.authHeader() },
					body: form
				});
				if (!up.ok) {
					// Fields are saved — keep staged files so the user can retry.
					error = t().admin.uploadFailed;
					return;
				}
				const rows = (await up.json()) as ImgRow[];
				editImages = [...editImages, ...rows];
				clearPending();
			}
			// A rename changes this page's own URL — follow it, else back to list.
			if (updated.slug && updated.slug !== slug) {
				await goto(localize(`/admin/products/${updated.slug}/edit`, locale.current));
			} else {
				await goto(localize('/admin/products', locale.current));
			}
		} catch {
			error = t().admin.loadFail;
		} finally {
			saving = 'idle';
		}
	}

	// Stage newly picked files — upload happens on Save so nothing reaches
	// storage before the user commits (no orphan uploads from abandoned edits).
	function pickFiles(files: FileList) {
		for (const f of files) pending.push({ file: f, url: URL.createObjectURL(f) });
	}

	function moveItem<T>(list: T[], index: number, dir: -1 | 1): T[] {
		const to = index + dir;
		if (to < 0 || to >= list.length) return list;
		const next = [...list];
		const [item] = next.splice(index, 1);
		next.splice(to, 0, item);
		return next;
	}

	function dropItem<T>(list: T[], from: number, to: number): T[] {
		if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return list;
		const next = [...list];
		const [item] = next.splice(from, 1);
		next.splice(to, 0, item);
		return next;
	}

	function movePersisted(index: number, dir: -1 | 1) {
		editImages = moveItem(editImages, index, dir);
		orderDirty = true;
	}

	function dropPersisted(from: number, to: number) {
		editImages = dropItem(editImages, from, to);
		orderDirty = true;
	}

	function movePending(index: number, dir: -1 | 1) {
		pending = moveItem(pending, index, dir);
	}

	function dropPending(from: number, to: number) {
		pending = dropItem(pending, from, to);
	}

	function unstage(index: number) {
		const [removed] = pending.splice(index, 1);
		if (removed) URL.revokeObjectURL(removed.url);
	}

	function clearPending() {
		for (const p of pending) URL.revokeObjectURL(p.url);
		pending = [];
	}

	onDestroy(clearPending);

	async function removeImage(id: number) {
		if (busy) return;
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
		<form onsubmit={save} class="mt-6 grid gap-4 rounded-card border border-line bg-surface p-6 shadow-card">
			<Field label={t().admin.attachImages}>
				<AdminImageGrid
					images={editImages.map((i) => ({ id: i.id, url: i.url, alt: i.alt }))}
					pending={pending.map((p) => ({ url: p.url, name: p.file.name }))}
					{busy}
					nameFallback={fName}
					onPick={pickFiles}
					onUnstage={unstage}
					onRemove={removeImage}
					onMovePersisted={movePersisted}
					onMovePending={movePending}
					onDropPersisted={dropPersisted}
					onDropPending={dropPending}
				/>
			</Field>
			<Field label={t().admin.productName} required><input bind:value={fName} required minlength="2" class="w-full rounded-lg border px-4 py-2.5 font-normal" /></Field>
			<Field label="Slug" hint={t().admin.slugAutoNote}><span class="block w-full rounded-lg border border-line bg-band px-4 py-2.5 font-mono text-sm font-normal text-muted">{slug}</span></Field>
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
				<button type="submit" disabled={busy} class="rounded-full bg-brand px-5 py-2 font-bold text-brand-ink disabled:opacity-60">
					{saving === 'images' ? t().admin.uploading : saving === 'product' ? t().admin.saving : t().admin.save}
				</button>
				<a href={localize('/admin/products', locale.current)} class="rounded-full border border-line px-5 py-2 text-sm font-bold">{t().admin.cancel}</a>
			</div>
		</form>
	{/if}
</section>
