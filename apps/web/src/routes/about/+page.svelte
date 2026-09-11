<script lang="ts">
	import { t, locale } from '$lib/locale.svelte';
	import { reveal } from '$lib/reveal';
	import SectionHead from '$lib/components/SectionHead.svelte';
	import PhotoPlaceholder from '$lib/components/PhotoPlaceholder.svelte';
	import { parseMilestones, parseValues } from '$lib/csv';

	let { data } = $props();

	type Sec = { heading?: string | null; body?: string | null; imageUrl?: string | null };
	// Data is static per SSR load (remounts on nav), so capturing initial value is intended.
	// svelte-ignore state_referenced_locally
	const S = (data.sections ?? {}) as Record<string, Sec>;
	function cx(key: string, fallback: string): string {
		const body = S[key]?.body?.trim();
		return body ? body! : fallback;
	}
	const storyFallback = `${t().about.p1} ${t().about.p2}`;
	const storyImg = S['story.image_url']?.imageUrl?.trim() || '';

	// Milestones: single `milestone` CSV key (`year, "text"` per line), fallback to dict.
	const milestones = $derived.by(() => {
		const rows = parseMilestones(S['milestone']?.body ?? '');
		return rows.length ? rows : t().about.milestones;
	});
	// Values: `about.value.list` CSV (`"title", "sub"` per line), fallback to dict.
	const values = $derived.by(() => {
		const rows = parseValues(S['about.value.list']?.body ?? '');
		return rows.length ? rows : t().about.values;
	});
	const valuesTitle = cx('about.value.title', t().about.valuesTitle);
</script>

<svelte:head>
	<title>{locale.current === 'id' ? 'Tentang Kami' : 'About Us'} — Cahaya Bahari 89</title>
	<meta name="description" content={cx('about.story', storyFallback).slice(0, 150)} />
</svelte:head>

<section data-section="our-story" class="content-wrap pt-8 pb-6">
	<SectionHead eyebrow={t().nav.about} title={cx('about.title', t().about.title)} />
	<div class="mt-6 grid items-start gap-6 lg:grid-cols-2 lg:gap-8">
		<div use:reveal class="space-y-4 leading-relaxed text-muted">
			<p>{cx('about.story', storyFallback)}</p>
		</div>
		{#if storyImg}
			<img src={storyImg} alt="Our team and facility" class="aspect-[4/3] w-full rounded-card border border-line object-cover" loading="lazy" />
		{:else}
			<PhotoPlaceholder label="Our team & facility photo" aspect="aspect-[4/3]" />
		{/if}
	</div>
</section>

<section data-section="journey" class="bg-band">
	<div class="content-wrap py-10">
		<SectionHead title={cx('about.journeyTitle', t().about.journeyTitle)} />
		<ol class="relative mx-auto mt-8 max-w-3xl space-y-8 before:absolute before:bottom-2 before:left-[7px] before:top-2 before:w-px before:bg-line md:before:left-1/2 md:before:-translate-x-1/2">
			{#each milestones as m, i}
				<li use:reveal class="relative pl-10 md:w-1/2 md:pl-0 {i % 2 === 0 ? 'md:pr-10 md:text-right' : 'md:ml-auto md:pl-10'}">
					<span class="absolute left-0 top-1.5 h-4 w-4 rounded-full bg-accent ring-4 ring-band {i % 2 === 0 ? 'md:left-auto md:-right-2' : 'md:-left-2'}" aria-hidden="true"></span>
					<span class="font-display text-xl font-bold text-brand md:text-2xl">{m.year}</span>
					<p class="mt-1 leading-relaxed text-muted">{m.text}</p>
				</li>
			{/each}
		</ol>
	</div>
</section>

<section data-section="our-values" class="content-wrap py-10">
	<SectionHead title={valuesTitle} align="center" />
	<div class="mt-6 grid gap-4 md:grid-cols-3">
		{#each values as v}
			<div use:reveal class="rounded-card border border-line bg-surface p-5 shadow-card">
				<h3 class="font-display text-base font-bold md:text-xl">{v.title}</h3>
				<p class="mt-2 text-muted">{v.text}</p>
			</div>
		{/each}
	</div>
</section>
