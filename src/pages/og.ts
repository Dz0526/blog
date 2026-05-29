import type { APIRoute } from "astro";
import { ImageResponse, loadGoogleFont } from "workers-og";

export const GET: APIRoute = async ({ url }) => {
  const title = url.searchParams.get("title") ?? "dz99.me";
  const date = url.searchParams.get("date") ?? "";

  // workers-og / Satori layout rules:
  //   - Every <div> needs display:flex, even empty ones and text-only leaves.
  //   - The HTMLRewriter parser wraps text content in arrays, not plain strings.
  //   - No grid, no position:absolute inside card.
  const html =
    `<div style="display:flex;flex-direction:column;width:1200px;height:600px;` +
      `background:linear-gradient(to right,#66cdaa,#66cdda);">` +
      `<div style="display:flex;flex-direction:column;flex:1;background:white;` +
        `margin:30px;border-radius:6px;padding:40px;">` +
        `<div style="display:flex;flex:1;align-items:center;justify-content:center;` +
          `text-align:center;font-size:64px;font-weight:600;">${escapeHtml(title)}</div>` +
        `<div style="display:flex;justify-content:space-between;align-items:center;font-size:28px;">` +
          `<div style="display:flex;align-items:center;gap:12px;">` +
            `<div style="display:flex;width:64px;height:64px;border-radius:32px;background:#e2e8f0;"></div>` +
            `<div style="display:flex;">dz99.me</div>` +
          `</div>` +
          `<div style="display:flex;">${escapeHtml(date)}</div>` +
        `</div>` +
      `</div>` +
    `</div>`;

  let fonts: { name: string; data: Awaited<ReturnType<typeof loadGoogleFont>>; weight: number; style: string }[] = [];
  try {
    const fontData = await loadGoogleFont({ family: "Noto Sans JP", weight: 400 });
    fonts = [{ name: "Noto Sans JP", data: fontData, weight: 400, style: "normal" }];
  } catch {
    // graceful degradation: render without custom font
  }

  const imgResp = new ImageResponse(html, { width: 1200, height: 600, fonts });
  const buf = await imgResp.arrayBuffer();
  return new Response(buf, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, immutable, no-transform, max-age=31536000",
    },
  });
};

function escapeHtml(s: string) {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!
  );
}
