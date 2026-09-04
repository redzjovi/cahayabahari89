<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import '../app.css';
	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<header class="border-b bg-white">
	<nav class="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
		<a href="/" class="font-bold text-lg">Cahaya Bahari 89</a>
		<div class="flex gap-4 text-sm">
			<a href="/" class="hover:underline">Home</a>
			<a href="/about" class="hover:underline">About</a>
			<a href="/services" class="hover:underline">Services</a>
			<a href="/katalog" class="hover:underline">Katalog</a>
			<a href="/contact" class="rounded bg-black px-3 py-1.5 text-white hover:bg-zinc-800">Contact</a>
		</div>
	</nav>
</header>
<main class="mx-auto max-w-6xl px-4 py-8">
	{@render children()}
</main>
<footer class="mx-auto max-w-6xl px-4 py-8 text-sm text-zinc-500 border-t mt-8">
	© {new Date().getFullYear()} Cahaya Bahari 89 — Built with SvelteKit + Hono on Cloudflare.
</footer>
