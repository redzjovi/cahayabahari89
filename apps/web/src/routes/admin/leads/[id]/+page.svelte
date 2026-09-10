<script lang="ts">
	import { t, locale } from '$lib/locale.svelte';
	import { localize } from '$lib/routes';
	import { adminSession } from '$lib/admin-session.svelte';
	import { page } from '$app/state';
	import { onMount } from 'svelte';

	type LeadRow = {
		id: number; name: string; email: string; company: string | null;
		volume: string | null; message: string; createdAt?: string | null;
	};

	const id = $derived(Number(page.params.id));

	let lead = $state<LeadRow | null>(null);
	let error = $state('');
	let loading = $state(true);
	let notFound = $state(false);

	const canView = $derived(adminSession.can('leads.read'));

	function formatDateTime(value: string | null | undefined): string {
		if (!value) return '—';
		const iso = value.includes('T') ? value : value.replace(' ', 'T') + 'Z';
		const d = new Date(iso);
		if (Number.isNaN(d.getTime())) return value;
		return d.toLocaleString(locale.current === 'id' ? 'id-ID' : 'en-US', {
			year: 'numeric',
			month: 'short',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	onMount(async () => {
		adminSession.init();
		if (!(await adminSession.refresh())) return;
		if (!canView) {
			loading = false;
			return;
		}
		if (!Number.isInteger(id)) {
			notFound = true;
			loading = false;
			return;
		}
		try {
			const res = await adminSession.api(`/api/admin/leads/${id}`);
			if (res.status === 404) {
				notFound = true;
				return;
			}
			if (!res.ok) throw new Error('load');
			lead = (await res.json()) as LeadRow;
		} catch {
			error = t().admin.loadFail;
		} finally {
			loading = false;
		}
	});
</script>

<svelte:head><title>{t().admin.leads} #{id} — Admin</title></svelte:head>

<section class="content-wrap max-w-3xl py-10">
	<a href={localize('/admin/leads', locale.current)} class="text-sm font-semibold text-muted underline hover:text-ink">&larr; {t().admin.leads}</a>
	<h1 class="mt-3 font-display text-3xl font-bold">{t().admin.leads} #{id}</h1>

	{#if !canView}
		<p class="mt-6 rounded-card border border-line p-6 text-muted">{t().admin.noAccess}</p>
	{:else if loading}
		<p class="mt-6 text-muted">…</p>
	{:else if notFound}
		<p class="mt-6 rounded-card border border-line p-6 text-muted">404</p>
	{:else}
		{#if error}<p class="mt-4 rounded-lg bg-red-500/10 p-3 text-sm font-medium text-red-500">{error}</p>{/if}
		{#if lead}
			<dl class="mt-6 divide-y divide-line rounded-card border border-line bg-surface shadow-card">
				<div class="grid gap-1 px-5 py-3 sm:grid-cols-[160px_1fr] sm:gap-4">
					<dt class="text-sm font-bold text-muted">{t().admin.name}</dt>
					<dd class="text-sm font-semibold">{lead.name}</dd>
				</div>
				<div class="grid gap-1 px-5 py-3 sm:grid-cols-[160px_1fr] sm:gap-4">
					<dt class="text-sm font-bold text-muted">{t().admin.email}</dt>
					<dd class="text-sm"><a href="mailto:{lead.email}" class="font-semibold underline hover:text-brand">{lead.email}</a></dd>
				</div>
				<div class="grid gap-1 px-5 py-3 sm:grid-cols-[160px_1fr] sm:gap-4">
					<dt class="text-sm font-bold text-muted">{t().admin.companyCol}</dt>
					<dd class="text-sm">{lead.company ?? '—'}</dd>
				</div>
				<div class="grid gap-1 px-5 py-3 sm:grid-cols-[160px_1fr] sm:gap-4">
					<dt class="text-sm font-bold text-muted">{t().admin.volumeCol}</dt>
					<dd class="text-sm">{lead.volume ?? '—'}</dd>
				</div>
				<div class="grid gap-1 px-5 py-3 sm:grid-cols-[160px_1fr] sm:gap-4">
					<dt class="text-sm font-bold text-muted">{t().admin.createdAt}</dt>
					<dd class="text-sm">{formatDateTime(lead.createdAt)}</dd>
				</div>
				<div class="grid gap-1 px-5 py-3 sm:grid-cols-[160px_1fr] sm:gap-4">
					<dt class="text-sm font-bold text-muted">{t().admin.messageCol}</dt>
					<dd class="whitespace-pre-wrap text-sm leading-relaxed">{lead.message}</dd>
				</div>
			</dl>
		{/if}
	{/if}
</section>
