// casino-pages-proxy
// Reverse proxy in front of the Cloudflare Pages deployment for the branded domain.
// Follows the same pattern as slotmachine-pages-proxy / games-pages-proxy in this account.
// Adds: www -> apex 301 redirect, and rewrites origin Location headers back to the canonical host.

const ORIGIN = "https://casino-game-3nn.pages.dev";
const CANONICAL = "https://casino.vip01.cc.cd";

export default {
  async fetch(request) {
    const url = new URL(request.url);

    // multi-domain redirect: www.<apex> -> apex (301)
    if (url.hostname === "www.casino.vip01.cc.cd") {
      return Response.redirect(CANONICAL + url.pathname + url.search, 301);
    }

    const target = ORIGIN + url.pathname + url.search;
    const init = {
      method: request.method,
      headers: request.headers,
      redirect: "manual"
    };
    if (request.method !== "GET" && request.method !== "HEAD") {
      init.body = request.body;
    }

    const resp = await fetch(new Request(target, init));
    const headers = new Headers(resp.headers);

    // keep visitors on the canonical domain when Pages answers with a redirect
    const loc = headers.get("location");
    if (loc && loc.indexOf(ORIGIN) === 0) {
      headers.set("location", CANONICAL + loc.slice(ORIGIN.length));
    }

    headers.set("X-Served-By", "casino-pages-proxy");
    return new Response(resp.body, { status: resp.status, statusText: resp.statusText, headers });
  }
};
