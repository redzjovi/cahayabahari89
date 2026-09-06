<script lang="ts">
	import { t } from '$lib/locale.svelte';
	import { localize } from '$lib/routes';
	import { adminSession } from '$lib/admin-session.svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let { data } = $props();
	let email = $state('');
	let password = $state('');
	let error = $state('');
	let busy = $state(false);

	onMount(async () => {
		adminSession.init();
		if (await adminSession.refresh()) await goto(localize('/admin/users', data.locale));
	});

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		error = '';
		busy = true;
		try {
			const res = await fetch('/api/auth/login', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ email, password })
			});
			if (!res.ok) {
				error = t().admin.badCredentials;
				return;
			}
			const body = (await res.json()) as { token: string };
			adminSession.setToken(body.token);
			await goto(localize('/admin/users', data.locale));
		} finally {
			busy = false;
		}
	}
</script>

<svelte:head><title>{t().admin.loginTitle} — Cahaya Bahari 89</title></svelte:head>

<section class="content-wrap py-12">
	<div class="mx-auto max-w-md rounded-card border border-line bg-surface p-8 shadow-card">
		<h1 class="font-display text-2xl font-bold">{t().admin.loginTitle}</h1>
		<p class="mt-1 text-sm text-muted">{t().admin.loginSub}</p>
		{#if error}
			<p class="mt-4 rounded-lg bg-red-500/10 p-3 text-sm font-medium text-red-500">{error}</p>
		{/if}
		<form onsubmit={submit} class="mt-6 grid gap-4">
			<label class="grid gap-1.5 text-sm font-semibold">
				{t().admin.email}
				<input type="email" bind:value={email} required autocomplete="username" class="rounded-lg border px-4 py-2.5 font-normal" />
			</label>
			<label class="grid gap-1.5 text-sm font-semibold">
				{t().admin.password}
				<input type="password" bind:value={password} required autocomplete="current-password" class="rounded-lg border px-4 py-2.5 font-normal" />
			</label>
			<button type="submit" disabled={busy} class="rounded-full bg-brand px-6 py-2.5 font-bold text-brand-ink transition hover:brightness-110 disabled:opacity-50">
				{busy ? '…' : t().admin.signIn}
			</button>
		</form>
	</div>
</section>
