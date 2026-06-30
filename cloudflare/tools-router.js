const PREFIX = "/quickreproprac";
const ORIGIN = "https://quickreproprac.pages.dev";
const BYPASS_HEADER = "x-quickreproprac-origin";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname !== PREFIX && !url.pathname.startsWith(`${PREFIX}/`)) {
      return new Response("Not Found", { status: 404 });
    }

    // 末尾スラッシュ無しの /quickreproprac で開かれた場合、ページ内の相対パス
    // (js/main.js 等) が /js/... に解決されてプレフィックス外になり 404 となる。
    // /quickreproprac/ へ 301 リダイレクトして相対パスを /quickreproprac/ 基準に揃える。
    if (url.pathname === PREFIX) {
      return Response.redirect(`${url.origin}${PREFIX}/${url.search}`, 301);
    }

    const originPath = url.pathname.slice(PREFIX.length) || "/";
    const target = `${ORIGIN}${originPath}${url.search}`;
    const headers = new Headers(request.headers);

    if (env.ORIGIN_BYPASS_TOKEN) {
      headers.set(BYPASS_HEADER, env.ORIGIN_BYPASS_TOKEN);
    }

    const init = {
      method: request.method,
      headers,
      redirect: "manual",
    };

    if (request.method !== "GET" && request.method !== "HEAD") {
      init.body = request.body;
    }

    return fetch(target, init);
  },
};
