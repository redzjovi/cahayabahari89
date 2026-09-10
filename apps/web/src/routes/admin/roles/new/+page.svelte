<script lang="ts">
	import { t, locale } from '$lib/locale.svelte';
	import { localize } from '$lib/routes';
	import { adminSession } from '$lib/admin-session.svelte';
	import Field from '$lib/components/Field.svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let perms = $state<{ slug: string; name: string }[]>([]);
	let error = $state('');
	let ready = $state(false);

	let rSlug = $state('');
	let rName = $state('');
	let rPerms = $state<string[]>([]);

	const canView = $derived(adminSession.can('roles.manage'));

	onMount(async () => {
		adminSession.init();
		if (!(await adminSession.refresh())) return;
		if (!canView) return;
		try {
			const res = await adminSession.api('/api/admin/permissions');
			if (res.ok) perms = ((await res.json()) as { data: { slug: string; name: string }[] }).data;
		} catch {
			// optional for the form
		}
		ready = true;
	});

	function apiError(json: unknown): string {
		const j = json as { message?: string; errors?: Record<string, string | string[]> };
		const e = j.message ?? Object.values(j.errors ?? {}).flat().join(' ') ?? '';
		if (e.includes('already exists')) return t().admin.duplicate;
		if (e.includes('unknown')) return t().admin.unknownRef;
		return e || t().admin.loadFail;
	}

	async function save(e: SubmitEvent) {
		e.preventDefault();
		error = '';
		try {
			const res = await adminSession.api('/api/admin/roles', {
				method: 'POST',
				body: JSON.stringify({ slug: rSlug.trim().toLowerCase(), name: rName, permissions: rPerms })
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

<svelte:head><title>{t().admin.createRole} — Admin</title></svelte:head>

<section class="content-wrap max-w-3xl py-10">
	<a href={localize('/admin/roles', locale.current)} class="text-sm font-semibold text-muted underline hover:text-ink">&larr; {t().admin.roles}</a>
	<h1 class="mt-3 font-display text-3xl font-bold">{t().admin.createRole}</h1>

	{#if !canView && ready}
		<p class="mt-6 rounded-card border border-line p-6 text-muted">{t().admin.noAccess}</p>
	{:else}
		{#if error}<p class="mt-4 rounded-lg bg-red-500/10 p-3 text-sm font-medium text-red-500">{error}</p>{/if}
		<form onsubmit={save} class="mt-6 grid gap-4 rounded-card border border-line bg-surface p-6 shadow-card">
			<Field label={t().admin.roleSlug} required hint={t().admin.roleSlugHint}><input bind:value={rSlug} required minlength="2" class="w-full rounded-lg border px-4 py-2.5 font-mono font-normal" /></Field>
			<Field label={t().admin.roleName} required><input bind:value={rName} required minlength="2" class="w-full rounded-lg border px-4 py-2.5 font-normal" /></Field>
			<Field label={t().admin.permissionsTitle}>
				<span class="flex flex-wrap gap-3">
					{#each perms as p}
						<label class="flex cursor-pointer items-center gap-1.5 text-sm font-normal"><input type="checkbox" checked={rPerms.includes(p.slug)} onchange={(e) => (rPerms = e.currentTarget.checked ? [...rPerms, p.slug] : rPerms.filter((x) => x !== p.slug))} class="accent-[var(--brand)]" />{p.slug}</label>
					{/each}
				</span>
			</Field>
			<div class="flex gap-2 sm:pl-[196px]">
				<button type="submit" class="rounded-full bg-brand px-5 py-2 font-bold text-brand-ink">{t().admin.create}</button>
				<a href={localize('/admin/roles', locale.current)} class="rounded-full border border-line px-5 py-2 text-sm font-bold">{t().admin.cancel}</a>
			</div>
		</form>
	{/if}
</section>
