/**
 * Cloudflare Worker — 通用反向代理（解决浏览器 CORS 限制）
 * 部署后得到 *.workers.dev 地址，前端通过 /?url=xxx 调用
 *
 * 使用方法：
 *   1. Cloudflare Dashboard → Workers & Pages → Create → Worker
 *   2. 粘贴本文件代码 → Save and Deploy
 *   3. 复制生成的 https://<worker-name>.<account>.workers.dev
 *   4. 把该 URL 配置到 IP1234 前端
 */

// 允许的目标域名白名单（可选，留空则允许所有 https 域名）
// 为安全建议限制到必需的站点
const ALLOWED_HOSTS = [
  "2026.ip138.com",
  "ip138.com",
  "my.ip.cn",
  "ip.cn",
  // 可以继续添加需要的域名
];

// 请求超时（毫秒）
const TIMEOUT_MS = 15000;

// 代理缓存时长（秒）
const CACHE_TTL = 30;

export default {
  async fetch(request) {
    // 处理 CORS 预检
    if (request.method === "OPTIONS") {
      return handleCors(new Response(null, { status: 204 }));
    }

    // 只允许 GET 和 HEAD
    if (request.method !== "GET" && request.method !== "HEAD") {
      return handleCors(
        new Response("Method Not Allowed", { status: 405 })
      );
    }

    const url = new URL(request.url);
    const target = url.searchParams.get("url");

    // 参数校验
    if (!target) {
      return handleCors(
        jsonResponse({ error: "缺少 url 参数", usage: "/?url=https://example.com" }, 400)
      );
    }
    if (!/^https?:\/\//i.test(target)) {
      return handleCors(
        jsonResponse({ error: "仅允许 http/https 协议" }, 400)
      );
    }

    // 可选：域名白名单校验
    if (ALLOWED_HOSTS.length > 0) {
      const targetHost = new URL(target).hostname;
      const allowed = ALLOWED_HOSTS.some(
        h => targetHost === h || targetHost.endsWith("." + h)
      );
      if (!allowed) {
        return handleCors(
          jsonResponse({ error: `目标域名不在白名单中: ${targetHost}` }, 403)
        );
      }
    }

    try {
      // 发起上游请求
      const upstream = await fetch(target, {
        method: request.method,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; IP1234/1.0; +https://ip1234.cc/)",
          "Accept": "text/html,application/json,text/plain,*/*",
          "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
        },
        signal: AbortSignal.timeout(TIMEOUT_MS),
        redirect: "follow",
      });

      // 读取响应体
      const body = upstream.body;

      const response = new Response(body, {
        status: upstream.status,
        statusText: upstream.statusText,
        headers: new Headers(upstream.headers),
      });

      // 处理响应头
      const respHeaders = response.headers;
      respHeaders.set("Access-Control-Allow-Origin", "*");
      respHeaders.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
      respHeaders.set("Access-Control-Allow-Headers", "*");
      respHeaders.set("Access-Control-Max-Age", "86400");
      respHeaders.set("Cache-Control", `public, max-age=${CACHE_TTL}`);
      respHeaders.set("X-Proxy-By", "IP1234-CF-Worker");

      // 移除可能干扰的头
      respHeaders.delete("x-frame-options");
      respHeaders.delete("content-security-policy");
      respHeaders.delete("strict-transport-security");

      return response;
    } catch (err) {
      const msg = err.name === "TimeoutError" ? "上游请求超时" : err.message || "代理请求失败";
      return handleCors(
        jsonResponse({ error: msg, target }, 502)
      );
    }
  },
};

/* ============ 辅助函数 ============ */

function handleCors(response) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "*");
  response.headers.set("Access-Control-Max-Age", "86400");
  return response;
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
