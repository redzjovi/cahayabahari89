<script lang="ts">
	let {
		kind = 'fish',
		cls = 'h-7 w-9'
	}: {
		kind?: 'fish' | 'tuna' | 'mackerel' | 'squid' | 'shrimp' | 'snail' | 'conch';
		cls?: string;
	} = $props();
</script>

<!-- Stylized flat silhouettes, same family as FishMark. All use currentColor; details knock out with var(--bg). -->
{#if kind === 'fish'}
	<svg viewBox="0 0 80 40" fill="none" class={cls} aria-hidden="true">
		<path d="M5 20c10-14 25-18 40-18 10 0 18 5 22 10l10-8v16l-10-8c-4 5-12 10-22 10-15 0-30-4-40-18Z" fill="currentColor" />
		<circle cx="55" cy="18" r="2" fill="var(--bg)" />
	</svg>
{:else if kind === 'tuna'}
	<svg viewBox="0 0 80 40" fill="none" class={cls} aria-hidden="true">
		<path d="M8 28 2 34v-8l6-6v8Z" fill="currentColor" />
		<path d="M8 20C18 8 34 6 52 12c6 2 10 5 13 8-3 3-7 6-13 8-18 6-34 4-44-8Z" fill="currentColor" />
		<path d="M34 11l4-6 3 6h-7ZM34 29l4 6 3-6h-7ZM46 9l3-5 2 5h-5ZM46 31l3 5 2-5h-5Z" fill="currentColor" />
		<circle cx="54" cy="18" r="2" fill="var(--bg)" />
	</svg>
{:else if kind === 'mackerel'}
	<svg viewBox="0 0 80 40" fill="none" class={cls} aria-hidden="true">
		<path d="M4 20c11-11 26-14 42-12 8 1 14 4 18 8l12-6v10l-12-6c-4 4-10 7-18 8-16 2-31-1-42-2Z" fill="currentColor" />
		<path d="M34 9l5 8M42 9l5 8M50 10l5 7" stroke="var(--bg)" stroke-width="1.6" stroke-linecap="round" />
		<path d="M36 30l4 5 2-5h-6ZM46 30l4 5 2-5h-6Z" fill="currentColor" />
		<circle cx="56" cy="18" r="1.8" fill="var(--bg)" />
	</svg>
{:else if kind === 'squid'}
	<svg viewBox="0 0 80 40" fill="none" class={cls} aria-hidden="true">
		<path d="M10 4c8 4 14 10 16 16l-8 3 8 3c-2 6-8 12-16 16V4Z" fill="currentColor" />
		<path d="M26 20h18" stroke="currentColor" stroke-width="5" stroke-linecap="round" />
		<path d="M44 16c6-2 12-2 16 0M44 24c6 2 12 2 16 0M46 20h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
		<circle cx="34" cy="20" r="1.8" fill="var(--bg)" />
	</svg>
{:else if kind === 'shrimp'}
	<svg viewBox="0 0 80 40" fill="none" class={cls} aria-hidden="true">
		<path d="M14 30C20 18 34 10 52 12c8 1 14 5 17 10l-6 2 5 4c-3 5-11 8-20 7C34 34 22 34 14 30Z" fill="currentColor" />
		<path d="M30 13l-3 18M40 11l-2 20M50 12l-1 19" stroke="var(--bg)" stroke-width="1.4" />
		<path d="M14 30l-8-2 6-4 2-6 4 6-4 6Z" fill="currentColor" />
		<path d="M62 14C70 10 74 6 76 3M63 19c8-1 13-4 15-7" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
		<circle cx="56" cy="18" r="1.6" fill="var(--bg)" />
	</svg>
{:else if kind === 'snail'}
	<svg viewBox="0 0 80 40" fill="none" class={cls} aria-hidden="true">
		<circle cx="32" cy="20" r="13" fill="currentColor" />
		<path d="M32 20c0-4 3-6 6-5 2 1 3 3 2 5-1 3-4 4-6 3" stroke="var(--bg)" stroke-width="1.8" stroke-linecap="round" />
		<path d="M43 30c8 2 18 2 27 0-1 3-3 5-6 5H48c-3 0-5-2-5-5Z" fill="currentColor" />
		<path d="M58 30c0-6 2-10 5-13M66 30c1-5 3-8 6-11" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
	</svg>
{:else if kind === 'conch'}
	<svg viewBox="0 0 80 40" fill="none" class={cls} aria-hidden="true">
		<path d="M6 14l14-8 8 10-12 8-10-10Z" fill="currentColor" />
		<path d="M12 11l6-3M17 15l6-3" stroke="var(--bg)" stroke-width="1.3" stroke-linecap="round" />
		<ellipse cx="42" cy="22" rx="16" ry="11" fill="currentColor" />
		<path d="M32 17c6-3 14-3 19 1" stroke="var(--bg)" stroke-width="1.4" stroke-linecap="round" />
		<path d="M56 28c6 2 12 2 18 0-1 3-3 4-6 4h-8c-3 0-4-1-4-4Z" fill="currentColor" />
		<path d="M60 28c1-5 3-8 6-10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
	</svg>
{/if}
