import { defineMiddleware } from "astro:middleware";
import { mapOldUrl } from "./lib/redirects";
import { listBlogPosts, listArchivedArticles, listArchivedNippos } from "./lib/content";

export const onRequest = defineMiddleware(async (ctx, next) => {
  // 301 redirects: old URL schema → /archive/*
  const redirectTarget = mapOldUrl(ctx.url.pathname);
  if (redirectTarget) {
    return ctx.redirect(redirectTarget, 301);
  }

  // Custom sitemap: override emdash's sitemap index with our own full-URL sitemap
  if (ctx.url.pathname === "/sitemap.xml") {
    const base = "https://dz99.me";
    const [blog, articles, nippos] = await Promise.all([
      listBlogPosts(),
      listArchivedArticles(),
      listArchivedNippos(),
    ]);

    const urls = [
      `${base}/`,
      `${base}/blog/`,
      `${base}/archive/`,
      ...blog.map((p) => `${base}/blog/${p.slug}`),
      ...articles.map((a) => `${base}/archive/article/${a.slug}`),
      ...nippos.map((n) => `${base}/archive/nippo/${n.slug}`),
    ];

    const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u}</loc></url>`).join("\n")}
</urlset>`;

    return new Response(body, {
      headers: {
        "content-type": "application/xml",
        "Cache-Control": "public, max-age=3600",
      },
    });
  }

  return next();
});
