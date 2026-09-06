<script lang="ts">
	import { t, locale } from '$lib/locale.svelte';
	import { reveal } from '$lib/reveal';
	import SectionHead from '$lib/components/SectionHead.svelte';
	import PhotoPlaceholder from '$lib/components/PhotoPlaceholder.svelte';
	import { enhance } from '$app/forms';
	let { form } = $props();

	const WA_NUMBER = '6287877118199';
	const waLink = `https://wa.me/${WA_NUMBER}?text=Hello%20Cahaya%20Bahari%2089`;
	const EMAIL = 'sales@cahayabahari89.id';
</script>

<svelte:head><title>About & Contact — Cahaya Bahari 89</title></svelte:head>

<!-- 01 CONTACT CHANNELS -->
<section class="content-wrap pb-8 pt-12">
	<SectionHead eyebrow={t().contact.eyebrow} title="" />
	<div class="mt-8 grid gap-5 sm:grid-cols-2">
		<a
			href={waLink}
			target="_blank"
			rel="noreferrer"
			use:reveal
			class="lift flex items-center gap-5 rounded-card border border-line bg-surface p-7 shadow-card transition hover:border-brand"
		>
			<span class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-strong" aria-hidden="true">
				<svg viewBox="0 0 24 24" class="h-6 w-6" fill="none"><path d="M12 3.5c-4.7 0-8.5 3.8-8.5 8.5 0 1.5.4 3 1.1 4.3L3.5 20.5l4.3-1.1c1.3.7 2.7 1.1 4.2 1.1 4.7 0 8.5-3.8 8.5-8.5s-3.8-8.5-8.5-8.5Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" /><circle cx="9" cy="12" r="1.1" fill="currentColor" /><circle cx="12.2" cy="12" r="1.1" fill="currentColor" /><circle cx="15.4" cy="12" r="1.1" fill="currentColor" /></svg>
			</span>
			<span>
				<span class="block text-xs font-bold uppercase tracking-[0.14em] text-muted">WhatsApp</span>
				<span class="mt-1 block font-display text-xl font-bold hover:text-brand">+62 878-7711-8199</span>
				<span class="mt-1 block text-sm text-muted">Mon–Sat, 07:00–17:00 WIB</span>
			</span>
		</a>
		<a
			href="mailto:{EMAIL}"
			use:reveal
			class="lift flex items-center gap-5 rounded-card border border-line bg-surface p-7 shadow-card transition hover:border-brand"
		>
			<span class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-strong" aria-hidden="true">
				<svg viewBox="0 0 24 24" class="h-6 w-6" fill="none"><rect x="3" y="5" width="18" height="14" rx="2.5" stroke="currentColor" stroke-width="1.8" /><path d="m4.5 7.5 7.5 6 7.5-6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg>
			</span>
			<span>
				<span class="block text-xs font-bold uppercase tracking-[0.14em] text-muted">Email</span>
				<span class="mt-1 block font-display text-xl font-bold hover:text-brand">{EMAIL}</span>
				<span class="mt-1 block text-sm text-muted">{locale.current === 'id' ? 'Balasan maks. 1 hari kerja' : 'Replies within 1 business day'}</span>
			</span>
		</a>
	</div>
</section>

<!-- 02 INQUIRY FORM -->
<section class="mx-auto max-w-3xl px-4 py-8">
	<SectionHead title={t().contact.send} />
	<div use:reveal class="mt-6">
		{#if form?.ok}
			<p class="rounded-card bg-emerald-500/10 p-4 font-medium text-emerald-600">{t().contact.ok}</p>
		{/if}
		{#if form?.error}
			<p class="rounded-card bg-red-500/10 p-4 font-medium text-red-500">{t().contact.fail}</p>
		{/if}

		<form method="POST" use:enhance class="mt-2 grid gap-4 sm:grid-cols-2">
			<label class="grid gap-1.5 text-sm font-semibold">
				{t().contact.name}
				<input name="name" required minlength="2" class="rounded-card border px-4 py-3 font-normal" />
			</label>
			<label class="grid gap-1.5 text-sm font-semibold">
				{t().contact.company}
				<input name="company" class="rounded-card border px-4 py-3 font-normal" />
			</label>
			<label class="grid gap-1.5 text-sm font-semibold">
				{t().contact.email}
				<input name="email" type="email" required class="rounded-card border px-4 py-3 font-normal" />
			</label>
			<label class="grid gap-1.5 text-sm font-semibold">
				{t().contact.volume}
				<select name="volume" class="rounded-card border px-4 py-3 font-normal">
					{#each t().contact.volumes as v}
						<option value={v}>{v}</option>
					{/each}
				</select>
			</label>
			<label class="grid gap-1.5 text-sm font-semibold sm:col-span-2">
				{t().contact.message}
				<textarea name="message" required minlength="10" rows="5" class="rounded-card border px-4 py-3 font-normal"></textarea>
			</label>
			<div class="sm:col-span-2">
				<button type="submit" class="rounded-full bg-brand px-8 py-3.5 font-bold text-brand-ink transition hover:brightness-110">{t().contact.send}</button>
			</div>
		</form>
	</div>
</section>

<!-- 03 OUR STORY -->
<section class="content-wrap py-8">
	<SectionHead eyebrow={t().about.eyebrow} title={t().about.title} />
	<div class="mt-8 grid items-start gap-10 lg:grid-cols-2">
		<div use:reveal class="space-y-4 leading-relaxed text-muted">
			<p>{t().about.p1}</p>
			<p>{t().about.p2}</p>
		</div>
		<PhotoPlaceholder label="Our team & facility photo" aspect="aspect-[4/3]" />
	</div>
</section>

<!-- 04 OUR JOURNEY + VALUES -->
<section class="bg-band">
	<div class="content-wrap py-14">
		<SectionHead title={locale.current === 'id' ? 'Perjalanan kami' : 'Our journey'} />
		<ol class="mt-6 grid gap-5 md:grid-cols-4">
			{#each t().about.milestones as m}
				<li use:reveal class="rounded-card border border-line bg-surface p-6 shadow-card">
					<span class="font-display text-2xl font-bold text-brand">{m.year}</span>
					<p class="mt-2 text-sm text-muted">{m.text}</p>
				</li>
			{/each}
		</ol>
		<div class="mt-10 grid gap-5 md:grid-cols-3">
			{#each t().about.values as v}
				<div use:reveal class="rounded-card border border-line bg-surface p-7 shadow-card">
					<h3 class="font-display text-xl font-bold">{v.title}</h3>
					<p class="mt-2 text-muted">{v.text}</p>
				</div>
			{/each}
		</div>
	</div>
</section>
