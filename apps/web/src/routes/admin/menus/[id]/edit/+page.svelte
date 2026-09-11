<script lang="ts">
	import { t, locale } from '$lib/locale.svelte';
	import { localize } from '$lib/routes';
	import { adminSession } from '$lib/admin-session.svelte';
	import Field from '$lib/components/Field.svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { page } from '$app/state';

	let error = $state('');
	let ready = $state(false);
	let saving = $state(false);

	let fLoc = $state('header');
	let fLabelId = $state('');
	let fLabelEn = $state('');
	let fHref = $state('');
	let fSort = $state('0');
	let fVisible = $state(true);

	const canView = $derived(adminSession.can('content.manage'));
	const menuId = $derived(page.url.pathname.split('/').filter(Boolean).pop() ?? '');

	onMount(async () => {
		adminSession.init();
		if (!(await adminSession.refresh())) return;
		if (!canView) return;
		try {
			const res = await adminSession.api('/api/admin/menus?page=1&limit=100');
			if (!res.ok) throw new Error('load');
			const data = (await res.json()) as { data: { id: number; location: string; labelEn: string; labelId: string; href: string; sort: number; visible: number }[] };
			const row = data.data.find((m) => String(m.id) === menuId);
			if (!row) {
				error = t().admin.loadFail;
				return;
			}
			fLoc = row.location;
			fLabelId = row.labelId;
			fLabelEn = row.labelEn;
			fHref = row.href;
			fSort = String(row.sort);
			fVisible = row.visible === 1;
		} catch {
			error = t().admin.loadFail;
		} finally {
			ready = true;
		}
	});

	async function save(e: SubmitEvent) {
		e.preventDefault();
		if (saving) return;
		error = '';
		saving = true;
		try {
			const res = await adminSession.api(`/api/admin/menus/${menuId}`, {
				method: 'PATCH',
				body: JSON.stringify({
					location: fLoc,
					labelId: fLabelId,
					labelEn: fLabelEn,
					href: fHref.trim(),
					sort: Number(fSort) || 0,
					visible: fVisible
				})
			});
			if (!res.ok) {
				const j = (await res.json()) as { message?: string };
				error = j.message || t().admin.loadFail;
				return;
			}
			await goto(localize('/admin/menus', locale.current));
		} catch {
			error = t().admin.loadFail;
		} finally {
			saving = false;
		}
	}
</script>

<svelte:head><title>{t().admin.editMenu} — Admin</title></svelte:head>

<section class="content-wrap max-w-3xl py-10">
	<a href={localize('/admin/menus', locale.current)} class="text-sm font-semibold text-muted underline hover:text-ink">&larr; {t().admin.menusTitle}</a>
	<h1 class="mt-3 font-display text-3xl font-bold">{t().admin.editMenu}</h1>

	{#if !canView && ready}
		<p class="mt-6 rounded-card border border-line p-6 text-muted">{t().admin.noAccess}</p>
	{:else}
		{#if error}<p class="mt-4 rounded-lg bg-red-500/10 p-3 text-sm font-medium text-red-500">{error}</p>{/if}
		{#if ready}
			<form onsubmit={save} class="mt-6 grid gap-4 rounded-card border border-line bg-surface p-6 shadow-card">
				<Field label={t().admin.locationCol} required>
					<select bind:value={fLoc} class="w-full rounded-lg border px-4 py-2.5 font-normal">
						<option value="header">{t().admin.headerLoc}</option>
						<option value="social">{t().admin.socialLoc}</option>
					</select>
				</Field>
				<Field label={t().admin.labelId} required><input bind:value={fLabelId} required maxlength="100" class="w-full rounded-lg border px-4 py-2.5 font-normal" /></Field>
				<Field label={t().admin.labelEn}><input bind:value={fLabelEn} maxlength="100" class="w-full rounded-lg border px-4 py-2.5 font-normal" /></Field>
				<Field label={t().admin.linkHref} hint={t().admin.linkHint} required>
					<input bind:value={fHref} required maxlength="500" class="w-full rounded-lg border px-4 py-2.5 font-mono font-normal" />
				</Field>
				<Field label={t().admin.orderCol}><input type="number" bind:value={fSort} min="0" max="9999" class="w-full rounded-lg border px-4 py-2.5 font-normal" /></Field>
				<Field label={t().admin.visibleCol}>
					<label class="flex items-center gap-2 font-normal">
						<input type="checkbox" bind:checked={fVisible} class="h-4 w-4" />
						{t().admin.visibleCol}
					</label>
				</Field>
				<div class="flex gap-2 sm:pl-[196px]">
					<button type="submit" disabled={saving} class="rounded-full bg-brand px-5 py-2 font-bold text-brand-ink disabled:opacity-60">
						{saving ? t().admin.saving : t().admin.save}
					</button>
					<a href={localize('/admin/menus', locale.current)} class="rounded-full border border-line px-5 py-2 text-sm font-bold">{t().admin.cancel}</a>
				</div>
			</form>
		{:else}
			<p class="mt-6 text-muted">…</p>
		{/if}
	{/if}
</section>
