<script lang="ts">
	import { t, locale } from '$lib/locale.svelte';
	import { localize } from '$lib/routes';
	import { adminSession } from '$lib/admin-session.svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let error = $state('');
	let ready = $state(false);
	let cSlug = $state('');
	let cName = $state('');

	const canView = $derived(adminSession.can('categories.write'));

	onMount(async () => {
		adminSession.init();
		await adminSession.refresh();
		ready = true;
	});

	function apiError(json: unknown): string {
		const e = (json as { error?: string }).error ?? '';
		if (e.includes('already exists')) return t().admin.duplicate;
		return e || t().admin.loadFail;
	}

	async function save(e: SubmitEvent) {
		e.preventDefault();
		error = '';
		try {
			const res = await adminSession.api('/api/admin/categories', {
				method: 'POST',
				body: JSON.stringify({ slug: cSlug.trim().toLowerCase(), name: cName })
			});
			if (!res.ok) {
				error = apiError(await res.json());
				return;
			}
			await goto(localize('/admin/categories', locale.current));
		} catch {
			error = t().admin.loadFail;
		}
	}
</script>

<svelte:head><title>{t().admin.newCategory} — Admin</title></svelte:head>

<section class="content-wrap max-w-3xl py-10">
	<a href={localize('/admin/categories', locale.current)} class="text-sm font-semibold text-muted underline hover:text-ink">&larr; {t().admin.categoriesTitle}</a>
	<h1 class="mt-3 font-display text-3xl font-bold">{t().admin.newCategory}</h1>

	{#if !canView && ready}
		<p class="mt-6 rounded-card border border-line p-6 text-muted">{t().admin.noAccess}</p>
	{:else}
		{#if error}<p class="mt-4 rounded-lg bg-red-500/10 p-3 text-sm font-medium text-red-500">{error}</p>{/if}
		<form onsubmit={save} class="mt-6 grid gap-4 rounded-card border border-line bg-surface p-6 shadow-card sm:grid-cols-2">
			<label class="grid gap-1.5 text-sm font-semibold">{t().admin.roleSlug}<input bind:value={cSlug} required minlength="2" class="rounded-lg border px-4 py-2.5 font-mono font-normal" /></label>
			<label class="grid gap-1.5 text-sm font-semibold">{t().admin.categoryName}<input bind:value={cName} required minlength="2" class="rounded-lg border px-4 py-2.5 font-normal" /></label>
			<p class="text-xs text-muted sm:col-span-2">{t().admin.roleSlugHint}</p>
			<div class="flex gap-2 sm:col-span-2">
				<button type="submit" class="rounded-full bg-brand px-5 py-2 font-bold text-brand-ink">{t().admin.create}</button>
				<a href={localize('/admin/categories', locale.current)} class="rounded-full border border-line px-5 py-2 text-sm font-bold">{t().admin.cancel}</a>
			</div>
		</form>
	{/if}
</section>
