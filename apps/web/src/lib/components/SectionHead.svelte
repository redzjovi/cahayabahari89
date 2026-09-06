<script lang="ts">
	import { reveal } from '$lib/reveal';

	let {
		eyebrow = '',
		title = '',
		sub = '',
		index = '',
		align = 'left'
	}: { eyebrow?: string; title: string; sub?: string; index?: string; align?: 'left' | 'center' } = $props();
</script>

<div use:reveal class="flex max-w-2xl flex-col gap-3 {align === 'center' ? 'text-center mx-auto items-center' : 'text-left items-start'}">
	{#if index}
		<span class="font-display text-sm font-semibold tracking-[0.2em] text-accent-strong">{index}</span>
	{/if}
	{#if eyebrow}
		<span class="text-xs font-bold uppercase tracking-[0.18em] text-brand">{eyebrow}</span>
	{/if}
	{#if title}
		<h2 class="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">{title}</h2>
	{/if}
	{#if sub}
		<p class="text-muted">{sub}</p>
	{/if}
</div>
