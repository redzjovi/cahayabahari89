<script lang="ts">
	import FishMark from './FishMark.svelte';

	let {
		label = 'Salmon photo',
		aspect = 'aspect-[4/3]',
		rounded = true
	}: { label?: string; aspect?: string; rounded?: boolean } = $props();
</script>

<div
	role="img"
	aria-label={label}
	class="{aspect} flex w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-band via-accent-soft to-band {rounded
		? 'rounded-card'
		: ''} border border-line"
>
	<FishMark cls="h-10 w-10 text-accent-strong opacity-70" />
	<span class="px-4 text-center text-xs font-semibold uppercase tracking-[0.14em] text-muted">{label}</span>
</div>
