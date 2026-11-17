import { createRequestHandler } from "react-router";

const requestHandler = createRequestHandler(() => import("virtual:react-router/server-build"), import.meta.env.MODE);

export default {
  async fetch(request) {
    // Serve everything from the bare domain.
    const url = new URL(request.url);
    if (url.hostname.startsWith("www.")) {
      url.hostname = url.hostname.slice(4);
      return Response.redirect(url.toString(), 301);
    }
    return requestHandler(request);
  },
} satisfies ExportedHandler<Env>;
