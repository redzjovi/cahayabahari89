<script lang="ts">
	import { t } from '$lib/locale.svelte';
	import { localize } from '$lib/routes';
	import { adminSession } from '$lib/admin-session.svelte';
	import ReqMark from '$lib/components/ReqMark.svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let { data } = $props();
	let email = $state('');
	let password = $state('');
	let showPassword = $state(false);
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
				<span>{t().admin.email} <ReqMark /></span>
				<input type="email" bind:value={email} required autocomplete="username" class="rounded-lg border px-4 py-2.5 font-normal" />
			</label>
		<div class="grid gap-1.5 text-sm font-semibold">
			<label for="admin-password">{t().admin.password} <ReqMark /></label>
			<span class="relative block font-normal">
				<input
					id="admin-password"
					type={showPassword ? 'text' : 'password'}
					bind:value={password}
					required
					autocomplete="current-password"
					class="w-full rounded-lg border px-4 py-2.5 pr-11 font-normal"
				/>
				<button
					type="button"
					onclick={() => (showPassword = !showPassword)}
					aria-pressed={showPassword}
					aria-label={showPassword ? t().admin.hidePassword : t().admin.showPassword}
					title={showPassword ? t().admin.hidePassword : t().admin.showPassword}
					class="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-muted transition hover:text-ink"
				>
					{#if showPassword}
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
					{:else}
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
					{/if}
				</button>
			</span>
		</div>
			<button type="submit" disabled={busy} class="rounded-full bg-brand px-6 py-2.5 font-bold text-brand-ink transition hover:brightness-110 disabled:opacity-50">
				{busy ? '…' : t().admin.signIn}
			</button>
		</form>
	</div>
</section>
