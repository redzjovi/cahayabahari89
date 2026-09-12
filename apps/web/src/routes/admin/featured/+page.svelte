<script lang="ts">
	import { t } from '$lib/locale.svelte';
	import { adminSession } from '$lib/admin-session.svelte';
	import { preview } from '$lib/preview.svelte';
	import { onMount } from 'svelte';

	type Pick = {
		id: number; slug: string; name: string; price: number;
		image?: { url: string } | null;
	};

	let picks = $state<Pick[]>([]);
	let results = $state<Pick[]>([]);
	let q = $state('');
	let loading = $state(true);
	let saving = $state(false);
	let searching = $state(false);
	let error = $state('');
	let notice = $state('');

	const canView = $derived(adminSession.can('products.write'));
	const pickedIds = $derived(new Set(picks.map((p) => p.id)));

	async function load() {
		loading = true;
		error = '';
		try {
			const res = await adminSession.api('/api/admin/featured');
			if (!res.ok) throw new Error('load');
			picks = ((await res.json()) as { data: Pick[] }).data;
		} catch {
			error = t().admin.loadFail;
		} finally {
			loading = false;
		}
	}

	onMount(async () => {
		adminSession.init();
		if (!(await adminSession.refresh())) return;
		await load();
	});

	let qDebounce: ReturnType<typeof setTimeout> | null = null;
	function onSearchInput() {
		if (qDebounce) clearTimeout(qDebounce);
		if (!q.trim()) {
			results = [];
			return;
		}
		qDebounce = setTimeout(() => void search(), 300);
	}

	async function search() {
		searching = true;
		try {
			const res = await adminSession.api(`/api/products?q=${encodeURIComponent(q.trim())}&limit=8`);
			if (!res.ok) throw new Error('load');
			const data = ((await res.json()) as { data: Pick[] }).data;
			results = data.filter((p) => !pickedIds.has(p.id));
		} catch {
			error = t().admin.loadFail;
		} finally {
			searching = false;
		}
	}

	function add(p: Pick) {
		if (picks.length >= 4 || pickedIds.has(p.id)) return;
		picks = [...picks, p];
		results = results.filter((r) => r.id !== p.id);
	}

	function removeAt(i: number) {
		picks = picks.filter((_, j) => j !== i);
	}

	function move(i: number, dir: -1 | 1) {
		const j = i + dir;
		if (j < 0 || j >= picks.length) return;
		const next = [...picks];
		[next[i], next[j]] = [next[j], next[i]];
		picks = next;
	}

	async function save() {
		if (saving) return;
		error = '';
		notice = '';
		saving = true;
		try {
			const res = await adminSession.api('/api/admin/featured', {
				method: 'PUT',
				body: JSON.stringify({ productIds: picks.map((p) => p.id) })
			});
			if (!res.ok) {
				const j = (await res.json()) as { message?: string };
				error = j.message || t().admin.loadFail;
				return;
			}
			notice = t().admin.saved;
			await load();
		} catch {
			error = t().admin.loadFail;
		} finally {
			saving = false;
		}
	}
</script>

<svelte:head><title>{t().admin.featuredTitle} — Admin</title></svelte:head>

<section class="px-4 py-10 lg:px-8">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<h1 class="font-display text-3xl font-bold">{t().admin.featuredTitle}</h1>
		<button type="button" onclick={save} disabled={saving || loading} class="rounded-full bg-brand px-5 py-2 font-bold text-brand-ink transition hover:brightness-110 disabled:opacity-60">
			{saving ? t().admin.saving : t().admin.save}
		</button>
	</div>
	<p class="mt-2 text-sm text-muted">{t().admin.featuredNote}</p>

	{#if error}<p class="mt-4 rounded-lg bg-red-500/10 p-3 text-sm font-medium text-red-500">{error}</p>{/if}
	{#if notice}<p class="mt-4 rounded-lg bg-emerald-500/10 p-3 text-sm font-medium text-emerald-600">{notice}</p>{/if}

	{#if !canView}
		<p class="mt-6 rounded-card border border-line p-6 text-muted">{t().admin.noAccess}</p>
	{:else if loading}
		<p class="mt-6 text-muted">…</p>
	{:else}
		<ol class="mt-6 grid gap-3">
			{#each picks as p, i}
				<li class="flex items-center gap-3 rounded-card border border-line bg-surface p-3 shadow-card">
					<span class="font-display text-xl font-bold text-muted">#{i + 1}</span>
					{#if p.image?.url}
						<button type="button" onclick={() => preview.open(p.image!.url, p.name)} class="shrink-0 rounded-lg transition hover:opacity-90">
							<img src={p.image.url} alt="" class="h-10 w-14 rounded-lg border border-line object-cover" loading="lazy" />
						</button>
					{:else}
						<span class="flex h-10 w-14 shrink-0 items-center justify-center rounded-lg border border-line bg-accent-soft text-[10px] font-bold text-accent-strong" aria-hidden="true">—</span>
					{/if}
					<span class="min-w-0 flex-1">
						<span class="block truncate font-semibold">{p.name}</span>
						{#if i === 0}<span class="text-xs font-bold text-brand">{t().katalog.bestSeller}</span>{/if}
					</span>
					<span class="flex gap-1">
						<button type="button" onclick={() => move(i, -1)} disabled={i === 0} aria-label={t().admin.moveUp} class="rounded-full border border-line px-2.5 py-1 text-xs font-bold disabled:opacity-30">▲</button>
						<button type="button" onclick={() => move(i, 1)} disabled={i === picks.length - 1} aria-label={t().admin.moveDown} class="rounded-full border border-line px-2.5 py-1 text-xs font-bold disabled:opacity-30">▼</button>
						<button type="button" onclick={() => removeAt(i)} aria-label={t().admin.removePick} class="rounded-full border border-line px-3 py-1 text-xs font-bold hover:border-brand">×</button>
					</span>
				</li>
			{/each}
			{#if picks.length === 0}
				<li class="rounded-card border border-dashed border-line p-6 text-center text-muted">{t().admin.noResults}</li>
			{/if}
		</ol>

		{#if picks.length < 4}
			<div class="mt-4">
				<input bind:value={q} oninput={onSearchInput} placeholder={t().admin.searchProducts} class="w-full max-w-md rounded-full border px-4 py-2 text-sm" />
				{#if searching}
					<p class="mt-2 text-sm text-muted">…</p>
				{:else if results.length}
					<ul class="mt-2 grid max-w-md gap-2">
						{#each results as r}
							<li>
								<button type="button" onclick={() => add(r)} class="flex w-full items-center gap-3 rounded-lg border border-line bg-surface px-3 py-2 text-left text-sm transition hover:border-brand">
									<span class="min-w-0 flex-1 truncate font-semibold">{r.name}</span>
									<span class="shrink-0 font-bold text-brand">+</span>
								</button>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		{/if}
	{/if}
</section>
