import { defineMiddleware } from "astro:middleware";
import { mapOldUrl } from "./lib/redirects";

export const onRequest = defineMiddleware((ctx, next) => {
  const target = mapOldUrl(ctx.url.pathname);
  if (target) {
    return ctx.redirect(target, 301);
  }
  return next();
});
