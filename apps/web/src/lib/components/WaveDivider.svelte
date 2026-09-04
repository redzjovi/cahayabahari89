<script lang="ts">
	import { theme } from '$lib/theme.svelte';
</script>

{#if theme.current === 'aqua-fresh'}
	<div class="anim-drift overflow-hidden leading-[0]" aria-hidden="true">
		<svg viewBox="0 0 288 24" preserveAspectRatio="none" class="h-6 w-[120%] text-band">
			<path d="M0 12 Q 18 2 36 12 T 72 12 T 108 12 T 144 12 T 180 12 T 216 12 T 252 12 T 288 12 V24 H0 Z" fill="currentColor" />
		</svg>
	</div>
{/if}
