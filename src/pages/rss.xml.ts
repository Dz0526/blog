import type { APIRoute } from "astro";
import { getSiteSettings } from "emdash";

import { resolveBlogSiteIdentity } from "../utils/site-identity";
import { listBlogPosts } from "../lib/content";

export const GET: APIRoute = async ({ site, url }) => {
	const siteUrl = site?.toString().replace(/\/$/, "") || url.origin;
	const { siteTitle, siteTagline } = resolveBlogSiteIdentity(await getSiteSettings());

	const posts = await listBlogPosts({ limit: 20 });

	const items = posts
		.map((post) => {
			const postUrl = `${siteUrl}/blog/${escapeXml(post.slug)}`;
			const title = escapeXml(post.title || "Untitled");
			const description = escapeXml(post.excerpt ?? "");
			const pubDate = post.date ? new Date(post.date).toUTCString() : new Date().toUTCString();

			return `    <item>
      <title>${title}</title>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${description}</description>
    </item>`;
		})
		.join("\n");

	const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteTitle)}</title>
    <description>${escapeXml(siteTagline)}</description>
    <link>${siteUrl}</link>
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml"/>
    <language>ja</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;

	return new Response(rss, {
		headers: {
			"Content-Type": "application/rss+xml; charset=utf-8",
			"Cache-Control": "public, max-age=3600",
		},
	});
};

const XML_ESCAPE_PATTERNS = [
	[/&/g, "&amp;"],
	[/</g, "&lt;"],
	[/>/g, "&gt;"],
	[/"/g, "&quot;"],
	[/'/g, "&apos;"],
] as const;

function escapeXml(str: string): string {
	let result = str;
	for (const [pattern, replacement] of XML_ESCAPE_PATTERNS) {
		result = result.replace(pattern, replacement);
	}
	return result;
}
