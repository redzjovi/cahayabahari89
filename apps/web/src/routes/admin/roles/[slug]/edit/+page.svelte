<script lang="ts">
	import { t, locale } from '$lib/locale.svelte';
	import { localize } from '$lib/routes';
	import { adminSession } from '$lib/admin-session.svelte';
	import Field from '$lib/components/Field.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';

	const slug = $derived(page.params.slug as string);

	let perms = $state<{ slug: string; name: string }[]>([]);
	let error = $state('');
	let loading = $state(true);
	let notFound = $state(false);

	let rName = $state('');
	let ePerms = $state<string[]>([]);

	const canView = $derived(adminSession.can('roles.manage'));

	onMount(async () => {
		adminSession.init();
		if (!(await adminSession.refresh())) return;
		if (!canView) {
			loading = false;
			return;
		}
		try {
			const [rRes, pRes] = await Promise.all([adminSession.api('/api/admin/roles'), adminSession.api('/api/admin/permissions')]);
			if (!rRes.ok || !pRes.ok) throw new Error('load');
			const rows = (await rRes.json()) as { slug: string; name: string; permissions: string[] }[];
			const found = rows.find((r) => r.slug === slug);
			if (!found) {
				notFound = true;
				return;
			}
			rName = found.name;
			ePerms = [...found.permissions];
			perms = (await pRes.json()) as { slug: string; name: string }[];
		} catch {
			error = t().admin.loadFail;
		} finally {
			loading = false;
		}
	});

	function apiError(json: unknown): string {
		const e = (json as { error?: string }).error ?? '';
		if (e.includes('unknown')) return t().admin.unknownRef;
		return e || t().admin.loadFail;
	}

	async function save(e: SubmitEvent) {
		e.preventDefault();
		error = '';
		try {
			const res = await adminSession.api(`/api/admin/roles/${slug}`, {
				method: 'PATCH',
				body: JSON.stringify({ name: rName, permissions: ePerms })
			});
			if (!res.ok) {
				error = apiError(await res.json());
				return;
			}
			await goto(localize('/admin/roles', locale.current));
		} catch {
			error = t().admin.loadFail;
		}
	}
</script>

<svelte:head><title>{t().admin.editItem}: {slug} — Admin</title></svelte:head>

<section class="content-wrap max-w-3xl py-10">
	<a href={localize('/admin/roles', locale.current)} class="text-sm font-semibold text-muted underline hover:text-ink">&larr; {t().admin.roles}</a>
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
			<Field label={t().admin.roleName} required><input bind:value={rName} required minlength="2" class="w-full rounded-lg border px-4 py-2.5 font-normal" /></Field>
			<Field label={t().admin.permissionsTitle}>
				<span class="flex flex-wrap gap-3">
					{#each perms as p}
						<label class="flex cursor-pointer items-center gap-1.5 text-sm font-normal"><input type="checkbox" checked={ePerms.includes(p.slug)} onchange={(e) => (ePerms = e.currentTarget.checked ? [...ePerms, p.slug] : ePerms.filter((x) => x !== p.slug))} class="accent-[var(--brand)]" />{p.slug}</label>
					{/each}
				</span>
			</Field>
			<div class="flex gap-2 sm:pl-[196px]">
				<button type="submit" class="rounded-full bg-brand px-5 py-2 font-bold text-brand-ink">{t().admin.save}</button>
				<a href={localize('/admin/roles', locale.current)} class="rounded-full border border-line px-5 py-2 text-sm font-bold">{t().admin.cancel}</a>
			</div>
		</form>
	{/if}
</section>
