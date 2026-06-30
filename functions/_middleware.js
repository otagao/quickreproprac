const BYPASS_HEADER = "x-quickreproprac-origin";
const CANONICAL_PREFIX = "https://tools.otagao.net/quickreproprac";
const PAGES_HOST = "quickreproprac.pages.dev";

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const token = env.ORIGIN_BYPASS_TOKEN;
  const isInternalProxy =
    typeof token === "string" &&
    token.length > 0 &&
    request.headers.get(BYPASS_HEADER) === token;

  if (isInternalProxy) {
    return context.next();
  }

  // 正規ホストだけでなく、デプロイごとのプレビューエイリアス
  // (<hash>.quickreproprac.pages.dev) も含めて *.pages.dev を全て塞ぐ。
  if (url.hostname === PAGES_HOST || url.hostname.endsWith(`.${PAGES_HOST}`)) {
    const path = url.pathname === "/" ? "" : url.pathname;
    return Response.redirect(`${CANONICAL_PREFIX}${path}${url.search}`, 302);
  }

  return context.next();
}
