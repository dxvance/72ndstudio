// Router for 72ndstudio.com.
// The portfolio is served from this repo's static files. Each web app lives in
// its own repo and Cloudflare Worker, and is mounted under a path here:
//   72ndstudio.com/digi/...  ->  the "digi" Worker (dxvance/budget)
//
// To add an app: deploy its Worker, add a service binding in wrangler.jsonc,
// and add one line to APPS below (path -> binding name).
const APPS = {
  digi: 'DIGI',
  // rubric: 'RUBRIC',
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const first = url.pathname.split('/')[1];
    const binding = APPS[first] && env[APPS[first]];

    if (!binding) return env.ASSETS.fetch(request);

    const prefix = `/${first}`;

    // /digi -> /digi/ so the app's relative file paths resolve under the prefix.
    if (url.pathname === prefix) {
      return Response.redirect(`${url.origin}${prefix}/${url.search}`, 301);
    }

    // Hand the app its path without the prefix: /digi/sw.js -> /sw.js
    const inner = new URL(url);
    inner.pathname = url.pathname.slice(prefix.length);
    const response = await binding.fetch(new Request(inner, request));

    // Keep any redirects the app sends inside its own prefix.
    const location = response.headers.get('Location');
    if (location && location.startsWith('/') && !location.startsWith('//')) {
      const headers = new Headers(response.headers);
      headers.set('Location', prefix + location);
      return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
    }
    return response;
  },
};
