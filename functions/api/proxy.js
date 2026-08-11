/**
 * Cloudflare Pages Function — 通用反向代理
 * 路由：/api/proxy?url=<目标URL>
 * 解决浏览器端 CORS 限制，用于 IP138、IP.CN、网站分流 trace 等接口
 */
export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const target = url.searchParams.get("url");

  if (!target) {
    return new Response(JSON.stringify({ error: "Missing url parameter" }), {
      status: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  // 仅允许 http/https
  if (!/^https?:\/\//i.test(target)) {
    return new Response(JSON.stringify({ error: "Invalid url scheme" }), {
      status: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  // 预检请求
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  try {
    const upstream = await fetch(target, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; IP1234/1.0; +https://ip1234.cc/)",
        "Accept": "text/html,application/json,*/*",
      },
      signal: AbortSignal.timeout(10000),
    });

    const contentType = upstream.headers.get("Content-Type") || "text/plain; charset=utf-8";
    const body = await upstream.text();

    return new Response(body, {
      status: upstream.status,
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=30",
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || "Upstream fetch failed" }), {
      status: 502,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
}
