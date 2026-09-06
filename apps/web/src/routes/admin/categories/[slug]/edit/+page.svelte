<script lang="ts">
	import { t, locale } from '$lib/locale.svelte';
	import { localize } from '$lib/routes';
	import { adminSession } from '$lib/admin-session.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';

	const slug = $derived(page.params.slug as string);

	let error = $state('');
	let loading = $state(true);
	let notFound = $state(false);
	let cName = $state('');

	const canView = $derived(adminSession.can('categories.write'));

	onMount(async () => {
		adminSession.init();
		if (!(await adminSession.refresh())) return;
		if (!canView) {
			loading = false;
			return;
		}
		try {
			const res = await adminSession.api('/api/categories');
			if (!res.ok) throw new Error('load');
			const rows = (await res.json()) as { slug: string; name: string }[];
			const row = rows.find((r) => r.slug === slug);
			if (!row) {
				notFound = true;
				return;
			}
			cName = row.name;
		} catch {
			error = t().admin.loadFail;
		} finally {
			loading = false;
		}
	});

	async function save(e: SubmitEvent) {
		e.preventDefault();
		error = '';
		try {
			const res = await adminSession.api(`/api/admin/categories/${slug}`, {
				method: 'PATCH',
				body: JSON.stringify({ name: cName })
			});
			if (!res.ok) {
				const err = ((await res.json()) as { error?: string }).error ?? '';
				error = err || t().admin.loadFail;
				return;
			}
			await goto(localize('/admin/categories', locale.current));
		} catch {
			error = t().admin.loadFail;
		}
	}
</script>

<svelte:head><title>{t().admin.editItem}: {slug} — Admin</title></svelte:head>

<section class="content-wrap max-w-3xl py-10">
	<a href={localize('/admin/categories', locale.current)} class="text-sm font-semibold text-muted underline hover:text-ink">&larr; {t().admin.categoriesTitle}</a>
	<h1 class="mt-3 font-display text-3xl font-bold">{t().admin.editItem}: <span class="font-mono text-2xl">{slug}</span></h1>

	{#if !canView}
		<p class="mt-6 rounded-card border border-line p-6 text-muted">{t().admin.noAccess}</p>
	{:else if loading}
		<p class="mt-6 text-muted">…</p>
	{:else if notFound}
		<p class="mt-6 rounded-card border border-line p-6 text-muted">404</p>
	{:else}
		{#if error}<p class="mt-4 rounded-lg bg-red-500/10 p-3 text-sm font-medium text-red-500">{error}</p>{/if}
		<form onsubmit={save} class="mt-6 grid gap-4 rounded-card border border-line bg-surface p-6 shadow-card">
			<label class="grid gap-1.5 text-sm font-semibold">{t().admin.categoryName}<input bind:value={cName} required minlength="2" class="rounded-lg border px-4 py-2.5 font-normal" /></label>
			<div class="flex gap-2">
				<button type="submit" class="rounded-full bg-brand px-5 py-2 font-bold text-brand-ink">{t().admin.save}</button>
				<a href={localize('/admin/categories', locale.current)} class="rounded-full border border-line px-5 py-2 text-sm font-bold">{t().admin.cancel}</a>
			</div>
		</form>
	{/if}
</section>
