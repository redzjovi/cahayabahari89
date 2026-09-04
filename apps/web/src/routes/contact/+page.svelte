<script lang="ts">
	import { enhance } from '$app/forms';
	let { form } = $props();
</script>

<svelte:head><title>Contact — Cahaya Bahari 89</title></svelte:head>
<h1 class="text-2xl font-bold">Contact</h1>
<p class="text-zinc-600">Send a message — stored in D1 `leads` via embedded Hono `POST /api/contact`.</p>

{#if form?.ok}
	<p class="mt-4 rounded bg-green-50 p-3 text-green-700">Thanks! We received your message.</p>
{/if}
{#if form?.error}
	<p class="mt-4 rounded bg-red-50 p-3 text-red-700">{form.error}</p>
{/if}

<form method="POST" use:enhance class="mt-4 grid gap-3 max-w-lg">
	<input name="name" placeholder="Name" required class="rounded border px-3 py-2" />
	<input name="email" type="email" placeholder="Email" required class="rounded border px-3 py-2" />
	<textarea name="message" placeholder="Message (10+ chars)" required rows="4" class="rounded border px-3 py-2"></textarea>
	<button type="submit" class="rounded bg-black px-4 py-2 text-white">Send</button>
</form>

<div class="mt-6 text-sm text-zinc-500">
	Health: <a href="/api/health" class="underline">/api/health</a> • Categories: <a href="/api/categories" class="underline">/api/categories</a>
</div>
