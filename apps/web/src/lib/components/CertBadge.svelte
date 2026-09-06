<script lang="ts">
	let { label = '' }: { label?: string } = $props();
</script>

<span class="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-sm font-semibold text-ink shadow-card">
	<svg viewBox="0 0 12 12" class="h-3.5 w-3.5 text-brand" fill="none" aria-hidden="true"><path d="M2 6.5 4.8 9 10 3.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg>
	{label}
</span>
