/**
 * Cloudflare Pages Worker (Advanced Mode)
 * 处理 /api/proxy 反向代理 + 静态资源服务
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // /api/proxy — 反向代理，解决浏览器 CORS 限制
    if (url.pathname === "/api/proxy") {
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

      const target = url.searchParams.get("url");
      if (!target || !/^https?:\/\//i.test(target)) {
        return new Response(JSON.stringify({ error: "Invalid or missing url parameter" }), {
          status: 400,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
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

    // 其他请求交给静态资源处理
    return env.ASSETS.fetch(request);
  },
};
