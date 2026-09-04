<script lang="ts">
	let { cls = 'h-7 w-7' }: { cls?: string } = $props();
</script>

<svg viewBox="0 0 32 24" fill="none" class={cls} aria-hidden="true">
	<path
		d="M3 12C7.5 6.5 13 4 18.5 6.2L25 2.5 23.4 12l1.6 9.5L18.5 17.8C13 20 7.5 17.5 3 12Z"
		fill="currentColor"
	/>
	<circle cx="9.5" cy="10.5" r="1.4" fill="var(--bg)" />
</svg>
