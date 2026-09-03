interface AssetBinding {
  fetch(request: Request): Promise<Response>;
}

interface Environment {
  ASSETS: AssetBinding;
}

function withWebMcpHeaders(response: Response) {
  const headers = new Headers(response.headers);
  headers.set("Origin-Agent-Cluster", "?1");
  headers.set("Permissions-Policy", "tools=(self)");
  headers.set("X-Content-Type-Options", "nosniff");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

export default {
  async fetch(request: Request, environment: Environment) {
    let response = await environment.ASSETS.fetch(request);
    if (response.status === 404 && request.method === "GET") {
      const url = new URL(request.url);
      response = await environment.ASSETS.fetch(new Request(new URL("/index.html", url.origin), request));
    }
    return withWebMcpHeaders(response);
  },
};
