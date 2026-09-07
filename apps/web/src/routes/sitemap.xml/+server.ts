/** Static sitemap: locale roots + listing/contact pages. Product detail URLs are DB-driven (follow-up). */
const PATHS = ['/en', '/id', '/en/products', '/id/produk', '/en/contact', '/id/kontak', '/en/about', '/id/tentang-kami'];

export function GET({ url }) {
	const body =
		`<?xml version="1.0" encoding="UTF-8"?>\n` +
		`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
		PATHS.map((p) => `  <url><loc>${url.origin}${p}</loc></url>`).join('\n') +
		`\n</urlset>\n`;
	return new Response(body, {
		headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'max-age=3600' }
	});
}
