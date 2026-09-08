<script lang="ts">
	import { t, locale } from '$lib/locale.svelte';
	import { reveal } from '$lib/reveal';
	import SectionHead from '$lib/components/SectionHead.svelte';
	import PhotoPlaceholder from '$lib/components/PhotoPlaceholder.svelte';
</script>

<svelte:head>
	<title>{locale.current === 'id' ? 'Tentang Kami' : 'About Us'} — Cahaya Bahari 89</title>
	<meta name="description" content={t().about.p1.slice(0, 150)} />
</svelte:head>

<section data-section="our-story" class="content-wrap pt-8 pb-6">
	<SectionHead eyebrow={t().about.eyebrow} title={t().about.title} />
	<div class="mt-6 grid items-start gap-6 lg:grid-cols-2 lg:gap-8">
		<div use:reveal class="space-y-4 leading-relaxed text-muted">
			<p>{t().about.p1}</p>
			<p>{t().about.p2}</p>
		</div>
		<PhotoPlaceholder label="Our team & facility photo" aspect="aspect-[4/3]" />
	</div>
</section>

<section data-section="journey" class="bg-band">
	<div class="content-wrap py-10">
		<SectionHead title={t().about.journeyTitle} />
		<ol class="relative mx-auto mt-8 max-w-3xl space-y-8 before:absolute before:bottom-2 before:left-[7px] before:top-2 before:w-px before:bg-line md:before:left-1/2 md:before:-translate-x-1/2">
			{#each t().about.milestones as m, i}
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
	<SectionHead title={t().about.valuesTitle} align="center" />
	<div class="mt-6 grid gap-4 md:grid-cols-3">
		{#each t().about.values as v}
			<div use:reveal class="rounded-card border border-line bg-surface p-5 shadow-card">
				<h3 class="font-display text-base font-bold md:text-xl">{v.title}</h3>
				<p class="mt-2 text-muted">{v.text}</p>
			</div>
		{/each}
	</div>
</section>
