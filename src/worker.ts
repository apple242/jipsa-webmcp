interface AssetBinding {
  fetch(request: Request): Promise<Response>;
}

interface Environment {
  ASSETS: AssetBinding;
}

declare const __JIPSA_HTML__: string;

function withWebMcpHeaders(response: Response) {
  const headers = new Headers(response.headers);
  headers.set("Origin-Agent-Cluster", "?1");
  headers.set("Permissions-Policy", "tools=(self)");
  headers.set("X-Content-Type-Options", "nosniff");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

export default {
  async fetch(request: Request, environment: Environment) {
    const url = new URL(request.url);
    const isDocumentRoute =
      (request.method === "GET" || request.method === "HEAD") &&
      (url.pathname === "/" || !/\.[^/]+$/.test(url.pathname));

    if (isDocumentRoute) {
      return withWebMcpHeaders(
        new Response(request.method === "HEAD" ? null : __JIPSA_HTML__, {
          headers: { "Content-Type": "text/html; charset=utf-8" },
        }),
      );
    }

    return withWebMcpHeaders(await environment.ASSETS.fetch(request));
  },
};
