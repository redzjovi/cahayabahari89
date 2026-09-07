<script lang="ts">
	import { t, locale } from '$lib/locale.svelte';
	import { localize } from '$lib/routes';
	import { adminSession } from '$lib/admin-session.svelte';
	import Field from '$lib/components/Field.svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let roles = $state<{ slug: string; name: string }[]>([]);
	let error = $state('');
	let ready = $state(false);

	let fEmail = $state('');
	let fName = $state('');
	let fPassword = $state('');
	let fRoles = $state<string[]>([]);

	const canView = $derived(adminSession.can('users.manage'));

	onMount(async () => {
		adminSession.init();
		if (!(await adminSession.refresh())) return;
		if (!canView) return;
		try {
			const res = await adminSession.api('/api/admin/roles');
			if (res.ok) roles = (((await res.json()) as { slug: string; name: string }[])).map((r) => ({ slug: r.slug, name: r.name }));
		} catch {
			// roles optional for the form
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
		try {
			const res = await adminSession.api('/api/admin/users', {
				method: 'POST',
				body: JSON.stringify({ email: fEmail, name: fName, password: fPassword, roles: fRoles })
			});
			if (!res.ok) {
				error = apiError(await res.json());
				return;
			}
			await goto(localize('/admin/users', locale.current));
		} catch {
			error = t().admin.loadFail;
		}
	}
</script>

<svelte:head><title>{t().admin.createUser} — Admin</title></svelte:head>

<section class="content-wrap max-w-3xl py-10">
	<a href={localize('/admin/users', locale.current)} class="text-sm font-semibold text-muted underline hover:text-ink">&larr; {t().admin.users}</a>
	<h1 class="mt-3 font-display text-3xl font-bold">{t().admin.createUser}</h1>

	{#if !canView && ready}
		<p class="mt-6 rounded-card border border-line p-6 text-muted">{t().admin.noAccess}</p>
	{:else}
		{#if error}<p class="mt-4 rounded-lg bg-red-500/10 p-3 text-sm font-medium text-red-500">{error}</p>{/if}
		<form onsubmit={save} class="mt-6 grid gap-4 rounded-card border border-line bg-surface p-6 shadow-card">
			<Field label={t().admin.email} required><input type="email" bind:value={fEmail} required class="w-full rounded-lg border px-4 py-2.5 font-normal" /></Field>
			<Field label={t().admin.name} required><input bind:value={fName} required minlength="2" class="w-full rounded-lg border px-4 py-2.5 font-normal" /></Field>
			<Field label={t().admin.password} required><input type="password" bind:value={fPassword} required minlength="8" class="w-full rounded-lg border px-4 py-2.5 font-normal" /></Field>
			<Field label={t().admin.editRoles}>
				<span class="flex flex-wrap gap-3">
					{#each roles as r}
						<label class="flex cursor-pointer items-center gap-1.5 text-sm font-normal"><input type="checkbox" value={r.slug} checked={fRoles.includes(r.slug)} onchange={(e) => (fRoles = e.currentTarget.checked ? [...fRoles, r.slug] : fRoles.filter((x) => x !== r.slug))} class="accent-[var(--brand)]" />{r.slug}</label>
					{/each}
				</span>
			</Field>
			<div class="flex gap-2 sm:pl-[196px]">
				<button type="submit" class="rounded-full bg-brand px-5 py-2 font-bold text-brand-ink">{t().admin.create}</button>
				<a href={localize('/admin/users', locale.current)} class="rounded-full border border-line px-5 py-2 text-sm font-bold">{t().admin.cancel}</a>
			</div>
		</form>
	{/if}
</section>
