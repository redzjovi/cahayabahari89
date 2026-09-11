<script lang="ts">
	import { t, locale } from '$lib/locale.svelte';
	import { localize } from '$lib/routes';
	import { adminSession } from '$lib/admin-session.svelte';
	import { onMount } from 'svelte';
	import { parseCsvLines } from '$lib/csv';

	type Sec = {
		key: string;
		heading?: string | null;
		body?: string | null;
		imageUrl?: string | null;
		sort?: number | null;
	};

	type Kind = 'text' | 'csv' | 'image';

	type Row = {
		key: string;
		sort: number;
		kind: Kind;
		idBody: string;
		idImage: string;
		enBody: string;
		enImage: string;
		uploading: boolean;
		_dirty: boolean;
	};

	const PAGES = ['home', 'about', 'contact', 'site'] as const;
	const PAGE_PATH: Record<string, string> = { home: '/', about: '/about', contact: '/contact', site: '/' };
	const PAGE_LABEL: Record<string, string> = { home: 'Home', about: 'About', contact: 'Contact', site: 'Footer' };

	const ORDER: Record<string, string[]> = {
		home: ['hero.badge', 'hero.title', 'hero.sub', 'hero.image_url', 'cta.title', 'cta.sub', 'cta.button'],
		about: ['about.title', 'about.story', 'story.image_url', 'about.journeyTitle', 'milestone', 'about.value.title', 'about.value.list'],
		contact: ['contact.whatsapp', 'contact.whatsappDisplay', 'contact.hours', 'contact.email_address'],
		site: ['footer.tagline']
	};

	const CSV_KEYS = new Set(['milestone', 'about.value.list']);
	const IMAGE_KEYS = new Set(['hero.image_url', 'story.image_url']);
	const CSV_HINT = 'One per line — year, "text"  /  "title", "sub"';

	let activePage = $state<(typeof PAGES)[number]>('home');
	let activeLocale = $state<'id' | 'en'>('id');
	let rows = $state<Row[]>([]);
	let loading = $state(true);
	let saving = $state(false);
	let error = $state('');
	let notice = $state('');

	const canView = $derived(adminSession.can('content.manage'));

	const dirty = $derived(rows.some((r) => r._dirty));
	const missingEn = $derived(rows.filter((r) => r.kind !== 'image' && r.idBody.trim() && !r.enBody.trim()).length);
	const viewHref = $derived(localize(PAGE_PATH[activePage], locale.current));

	function prettyKey(key: string): string {
		return key.replace(/^hero\.|^about\.|^contact\.|^footer\.|^story\./, '').replace(/[._-]+/g, ' ');
	}

	function kindFor(key: string): Kind {
		if (IMAGE_KEYS.has(key) || key.endsWith('.image_url') || key.endsWith('.image')) return 'image';
		if (CSV_KEYS.has(key)) return 'csv';
		return 'text';
	}

	function buildRows(idSecs: Sec[], enSecs: Sec[]): Row[] {
		const idMap = new Map(idSecs.map((s) => [s.key, s]));
		const enMap = new Map(enSecs.map((s) => [s.key, s]));
		const order = ORDER[activePage] ?? [];
		const keys = [...order];
		for (const k of new Set([...idMap.keys(), ...enMap.keys()])) {
			if (!keys.includes(k)) keys.push(k);
		}
		return keys.map((key, i) => {
			const id = idMap.get(key);
			const en = enMap.get(key);
			return {
				key,
				sort: id?.sort ?? en?.sort ?? i,
				kind: kindFor(key),
				idBody: id?.body ?? '',
				idImage: (id?.imageUrl ?? '') as string,
				enBody: en?.body ?? '',
				enImage: (en?.imageUrl ?? '') as string,
				uploading: false,
				_dirty: false
			};
		});
	}

	async function load() {
		loading = true;
		error = '';
		notice = '';
		try {
			const [idRes, enRes] = await Promise.all([
				adminSession.api(`/api/pages/${activePage}?locale=id`),
				adminSession.api(`/api/pages/${activePage}?locale=en`)
			]);
			if (!idRes.ok || !enRes.ok) throw new Error('load');
			const idSecs = ((await idRes.json()) as { data: { sections: Sec[] } }).data.sections;
			const enSecs = ((await enRes.json()) as { data: { sections: Sec[] } }).data.sections;
			rows = buildRows(idSecs, enSecs);
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

	async function switchPage(p: (typeof PAGES)[number]) {
		if (p === activePage) return;
		if (dirty && !confirm('Unsaved changes — switch anyway?')) return;
		activePage = p;
		await load();
	}

	async function switchLocale(l: 'id' | 'en') {
		if (l === activeLocale) return;
		if (dirty && !confirm('Unsaved changes — switch anyway?')) return;
		activeLocale = l;
		for (const r of rows) r._dirty = false;
	}

	function markDirty(r: Row) {
		r._dirty = true;
	}

	function copyIdToEn() {
		for (const r of rows) {
			if (!r.enBody.trim() && r.idBody.trim()) {
				r.enBody = r.idBody;
				markDirty(r);
			}
			if (!r.enImage.trim() && r.idImage.trim()) {
				r.enImage = r.idImage;
				markDirty(r);
			}
		}
	}

	function singleLine(r: Row): boolean {
		const src = (activeLocale === 'id' ? r.idBody : r.enBody) || r.idBody;
		return !src.includes('\n') && src.length < 120 && !r.key.endsWith('.sub') && !r.key.endsWith('.story') && !r.key.endsWith('.tagline');
	}

	function csvCount(r: Row): number {
		const src = activeLocale === 'id' ? r.idBody : r.enBody;
		return parseCsvLines(src).filter((f) => f.length >= 2).length;
	}

	function r2KeyFromUrl(url: string): string | null {
		const m = url.match(/\/api\/images\/(cms\/.+)$/);
		return m ? m[1] : null;
	}

	async function uploadImage(r: Row, files: FileList | null) {
		const file = files?.[0];
		if (!file || r.uploading) return;
		error = '';
		r.uploading = true;
		try {
			const form = new FormData();
			form.set('page', activePage);
			form.set('key', r.key);
			form.set('file', file);
			const res = await fetch('/api/admin/content/images', {
				method: 'POST',
				headers: { authorization: adminSession.authHeader() },
				body: form
			});
			if (!res.ok) {
				const j = (await res.json().catch(() => ({}))) as { message?: string };
				error = j.message || t().admin.uploadFailed;
				return;
			}
			const { url } = ((await res.json()) as { data: { url: string } }).data;
			if (activeLocale === 'id') r.idImage = url;
			else r.enImage = url;
			markDirty(r);
			notice = t().admin.saved;
		} catch {
			error = t().admin.uploadFailed;
		} finally {
			r.uploading = false;
		}
	}

	async function removeImage(r: Row) {
		const url = (activeLocale === 'id' ? r.idImage : r.enImage).trim();
		const key = url ? r2KeyFromUrl(url) : null;
		if (key) {
			try {
				await adminSession.api(`/api/admin/content/images?key=${encodeURIComponent(key)}`, { method: 'DELETE' });
			} catch {
				// best-effort: field is cleared regardless
			}
		}
		if (activeLocale === 'id') r.idImage = '';
		else r.enImage = '';
		markDirty(r);
	}

	async function save() {
		if (saving) return;
		error = '';
		notice = '';
		saving = true;
		try {
			const sections = rows.map((r, i) => ({
				key: r.key,
				heading: null,
				body: (activeLocale === 'id' ? r.idBody : r.enBody) || null,
				imageUrl: (activeLocale === 'id' ? r.idImage : r.enImage) || null,
				sort: r.sort ?? i
			}));
			const res = await adminSession.api(`/api/admin/pages/${activePage}`, {
				method: 'PUT',
				body: JSON.stringify({ locale: activeLocale, sections })
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

<svelte:head><title>{t().admin.contentTitle} — Admin</title></svelte:head>

<section class="px-4 py-10 lg:px-8">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<h1 class="font-display text-3xl font-bold">{t().admin.contentTitle}</h1>
		<div class="flex flex-wrap gap-2">
			<a href={viewHref} target="_blank" rel="noreferrer" class="rounded-full border border-line px-4 py-2 text-sm font-bold hover:border-brand">{t().admin.viewPage} ↗</a>
			<button type="button" onclick={save} disabled={saving || loading} class="rounded-full bg-brand px-5 py-2 font-bold text-brand-ink transition hover:brightness-110 disabled:opacity-60">
				{saving ? t().admin.saving : t().admin.save}
			</button>
		</div>
	</div>

	{#if error}<p class="mt-4 rounded-lg bg-red-500/10 p-3 text-sm font-medium text-red-500">{error}</p>{/if}
	{#if notice}<p class="mt-4 rounded-lg bg-emerald-500/10 p-3 text-sm font-medium text-emerald-600">{notice}</p>{/if}

	{#if !canView}
		<p class="mt-6 rounded-card border border-line p-6 text-muted">{t().admin.noAccess}</p>
	{:else}
		<div class="mt-6 flex flex-wrap items-center gap-2" role="group" aria-label={t().admin.pageCol}>
			{#each PAGES as p}
				<button
					type="button"
					onclick={() => switchPage(p)}
					aria-pressed={activePage === p}
					class="rounded-full border px-4 py-1.5 text-sm font-bold transition {activePage === p ? 'border-brand bg-brand text-brand-ink' : 'border-line hover:border-brand'}"
				>{PAGE_LABEL[p]}</button>
			{/each}
			<span class="ml-2 flex items-center gap-1 rounded-full border border-line p-1 text-xs font-bold" role="group" aria-label={t().admin.localeCol}>
				{#each [{ id: 'id', label: 'ID' }, { id: 'en', label: 'EN' }] as l}
					<button
						type="button"
						aria-pressed={activeLocale === l.id}
						onclick={() => switchLocale(l.id as 'id' | 'en')}
						class="rounded-full px-2.5 py-1 transition {activeLocale === l.id ? 'bg-brand text-brand-ink' : 'text-muted hover:text-ink'}"
					>{l.label}</button>
				{/each}
			</span>
			{#if activeLocale === 'en'}
				<button type="button" onclick={copyIdToEn} class="rounded-full border border-line px-4 py-1.5 text-xs font-bold hover:border-brand">{t().admin.copyIdToEn}</button>
				{#if missingEn > 0}<span class="text-xs font-bold text-amber-600">{t().admin.missingEn}: {missingEn}</span>{/if}
			{:else}
				<span class="text-xs text-muted">{t().admin.fallbackNote}</span>
			{/if}
		</div>

		{#if loading}
			<p class="mt-6 text-muted">…</p>
		{:else}
			<div class="mt-4 grid gap-4">
				{#each rows as r}
					<div class="rounded-card border border-line bg-surface p-5 shadow-card">
						<div class="flex items-baseline justify-between gap-2">
							<h3 class="text-sm font-bold capitalize">{prettyKey(r.key)}</h3>
							<span class="font-mono text-[11px] text-muted">{r.key}</span>
						</div>
						{#if r.kind === 'image'}
							{@const imgVal = (activeLocale === 'id' ? r.idImage : r.enImage).trim()}
							{#if imgVal}
								<img src={imgVal} alt={r.key} class="mt-3 aspect-[4/3] w-full max-w-sm rounded-lg border border-line object-cover" loading="lazy" />
								<p class="mt-1 truncate font-mono text-[11px] text-muted">{imgVal}</p>
							{/if}
							<div class="mt-3 flex flex-wrap items-center gap-2">
								<label class="cursor-pointer rounded-full bg-brand px-4 py-2 text-sm font-bold text-brand-ink transition hover:brightness-110 {r.uploading ? 'opacity-60' : ''}">
									{r.uploading ? t().admin.uploading : t().admin.uploadImages}
									<input
										type="file"
										accept="image/jpeg,image/png,image/webp,image/avif"
										disabled={r.uploading}
										onchange={(e) => uploadImage(r, (e.currentTarget as HTMLInputElement).files)}
										class="hidden"
									/>
								</label>
								{#if imgVal}
									<button type="button" onclick={() => removeImage(r)} disabled={r.uploading} class="rounded-full border border-line px-4 py-2 text-sm font-bold hover:border-brand disabled:opacity-50">{t().admin.removeImage}</button>
								{/if}
							</div>
							<p class="mt-2 text-xs text-muted">{t().admin.uploadHint}</p>
						{:else if r.kind === 'csv'}
							<textarea
								value={activeLocale === 'id' ? r.idBody : r.enBody}
								oninput={(e) => { if (activeLocale === 'id') r.idBody = (e.currentTarget as HTMLTextAreaElement).value; else r.enBody = (e.currentTarget as HTMLTextAreaElement).value; markDirty(r); }}
								rows="6"
								spellcheck="false"
								class="mt-3 w-full rounded-lg border px-4 py-2.5 font-mono text-sm font-normal"
							></textarea>
							<p class="mt-1 text-xs text-muted">{CSV_HINT} — {csvCount(r)} rows</p>
							{#if activeLocale === 'en'}
								<p class="mt-2 text-xs text-muted">ID: {(r.idBody || '—').slice(0, 160)}</p>
								{#if !r.enBody.trim() && r.idBody.trim()}
									<p class="mt-1 text-xs font-bold text-amber-600">○ Showing ID fallback</p>
								{/if}
							{/if}
						{:else if singleLine(r)}
							<input
								value={activeLocale === 'id' ? r.idBody : r.enBody}
								oninput={(e) => { if (activeLocale === 'id') r.idBody = (e.currentTarget as HTMLInputElement).value; else r.enBody = (e.currentTarget as HTMLInputElement).value; markDirty(r); }}
								class="mt-3 w-full rounded-lg border px-4 py-2.5 font-normal"
							/>
							{#if activeLocale === 'en'}
								<p class="mt-2 text-xs text-muted">ID: {(r.idBody || '—').slice(0, 160)}</p>
								{#if !r.enBody.trim() && r.idBody.trim()}
									<p class="mt-1 text-xs font-bold text-amber-600">○ Showing ID fallback</p>
								{/if}
							{/if}
						{:else}
							<textarea
								value={activeLocale === 'id' ? r.idBody : r.enBody}
								oninput={(e) => { if (activeLocale === 'id') r.idBody = (e.currentTarget as HTMLTextAreaElement).value; else r.enBody = (e.currentTarget as HTMLTextAreaElement).value; markDirty(r); }}
								rows="4"
								class="mt-3 w-full rounded-lg border px-4 py-2.5 font-normal"
							></textarea>
							{#if activeLocale === 'en'}
								<p class="mt-2 text-xs text-muted">ID: {(r.idBody || '—').slice(0, 160)}</p>
								{#if !r.enBody.trim() && r.idBody.trim()}
									<p class="mt-1 text-xs font-bold text-amber-600">○ Showing ID fallback</p>
								{/if}
							{/if}
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	{/if}
</section>
