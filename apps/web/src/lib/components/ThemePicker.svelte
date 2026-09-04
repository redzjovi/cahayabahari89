<script lang="ts">
	import { theme, THEMES } from '$lib/theme.svelte';
	import { onMount } from 'svelte';

	let open = $state(false);

	onMount(() => theme.init());

	const active = $derived(THEMES.find((t) => t.id === theme.current) ?? THEMES[0]);
</script>

<div class="relative">
	<button
		type="button"
		onclick={() => (open = !open)}
		aria-haspopup="listbox"
		aria-expanded={open}
		aria-label="Choose theme"
		title={active.label}
		class="flex items-center gap-1.5 rounded-full border border-line bg-surface p-1.5 transition hover:border-muted"
	>
		<span class="inline-block h-4 w-4 rounded-full border border-line" style="background-color: {active.swatch}" aria-hidden="true"></span>
		<svg viewBox="0 0 12 12" class="h-3 w-3 text-muted" fill="none" aria-hidden="true"><path d="M3 4.5 6 7.5 9 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" /></svg>
	</button>

	{#if open}
		<button type="button" aria-label="Close" class="fixed inset-0 z-40 cursor-default" onclick={() => (open = false)}></button>
		<div role="listbox" aria-label="Themes" class="absolute right-0 z-50 mt-2 w-60 rounded-card border border-line bg-surface p-1.5 shadow-card">
			{#each THEMES as t}
				<button
					type="button"
					role="option"
					aria-selected={theme.current === t.id}
					onclick={() => {
						theme.set(t.id);
						open = false;
					}}
					class="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition hover:bg-bg {theme.current === t.id ? 'bg-bg' : ''}"
				>
					<span class="inline-block h-5 w-5 shrink-0 rounded-full border border-line" style="background-color: {t.swatch}" aria-hidden="true"></span>
					<span class="min-w-0">
						<span class="block truncate text-sm font-semibold">{t.label}</span>
						<span class="block truncate text-xs text-muted">{t.mood}</span>
					</span>
					{#if theme.current === t.id}
						<svg viewBox="0 0 12 12" class="ml-auto h-3.5 w-3.5 shrink-0 text-brand" fill="none" aria-hidden="true"><path d="M2 6.5 4.8 9 10 3.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg>
					{/if}
				</button>
			{/each}
		</div>
	{/if}
</div>
