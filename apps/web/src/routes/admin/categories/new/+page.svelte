<script lang="ts">
	import { t, locale } from '$lib/locale.svelte';
	import { localize } from '$lib/routes';
	import { adminSession } from '$lib/admin-session.svelte';
	import Field from '$lib/components/Field.svelte';
	import { slugify } from '$lib/slug';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let error = $state('');
	let ready = $state(false);
	let cName = $state('');
	let cStatus = $state('active');

	const canView = $derived(adminSession.can('categories.write'));
	const slugPreview = $derived(slugify(cName));

	onMount(async () => {
		adminSession.init();
		await adminSession.refresh();
		ready = true;
	});

	function apiError(json: unknown): string {
		const j = json as { message?: string; errors?: Record<string, string | string[]> };
		const e = j.message ?? Object.values(j.errors ?? {}).flat().join(' ') ?? '';
		if (e.includes('already exists')) return t().admin.duplicate;
		return e || t().admin.loadFail;
	}

	async function save(e: SubmitEvent) {
		e.preventDefault();
		error = '';
		if (!slugPreview) {
			error = t().admin.invalidName;
			return;
		}
		try {
			const res = await adminSession.api('/api/admin/categories', {
				method: 'POST',
				body: JSON.stringify({ name: cName, status: cStatus })
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
		<form onsubmit={save} class="mt-6 grid gap-4 rounded-card border border-line bg-surface p-6 shadow-card">
			<Field label={t().admin.categoryName} required><input bind:value={cName} required minlength="2" class="w-full rounded-lg border px-4 py-2.5 font-normal" /></Field>
			<Field label="Slug" hint={t().admin.slugAutoNote}><span class="block w-full rounded-lg border border-line bg-band px-4 py-2.5 font-mono text-sm font-normal text-muted">{slugPreview || '—'}<span class="text-accent-strong">-id</span></span></Field>
			<Field label={t().admin.statusCol}>
				<select bind:value={cStatus} class="w-full rounded-lg border px-4 py-2.5 font-normal">
					<option value="active">{t().admin.active}</option>
					<option value="draft">{t().admin.draft}</option>
				</select>
			</Field>
			<div class="flex gap-2 sm:pl-[196px]">
				<button type="submit" class="rounded-full bg-brand px-5 py-2 font-bold text-brand-ink">{t().admin.create}</button>
				<a href={localize('/admin/categories', locale.current)} class="rounded-full border border-line px-5 py-2 text-sm font-bold">{t().admin.cancel}</a>
			</div>
		</form>
	{/if}
</section>
