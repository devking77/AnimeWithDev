
import * as BunnySDK from "https://esm.sh/@bunny.net/edgescript-sdk@0.11.2";
import { createHmac } from "node:crypto";

/**
 * CORS Headers
 */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

/**
 * Adds CORS headers to a Response.
 */
function withCORS(response: Response): Response {
  const headers = new Headers(response.headers);
  Object.entries(corsHeaders).forEach(([key, value]) =>
    headers.set(key, value)
  );
  return new Response(response.body, { ...response, headers });
}

/**
 * generateSignedUrl
 * - Creates a signature for a resourceId
 * - Adds an expiration time (UNIX timestamp, 10 minutes from now)
 * - Returns a local endpoint: /anime/hls/segment?src=xxx&sig=yyy&exp=zzz
 */
function generateSignedUrl(src: string, type: "segment" | "index"): string {
  const expirySeconds = type === "segment" ? 10800 : 300;
  const exp = Math.floor(Date.now() / 1000) + expirySeconds; // 600 seconds = 10 minutes
  const signature = createHmac(
    "sha256",
    Deno.env.get("SECRET_API_KEY") as string,
  )
    .update(`${src}${exp}${type}`)
    .digest("hex");
  const uri = type === "segment" ? "/segment" : "/index.m3u8";
  return `${uri}?src=${src}&sig=${signature}&exp=${exp}`;
}

/**
 * verifySignedUrl
 * - Checks if the signature matches
 * - Checks if the expiration hasn't passed
 */
function verifySignedUrl(
  src: string,
  sig: string,
  exp: string,
  type: "segment" | "index",
): boolean {
  const now = Math.floor(Date.now() / 1000);
  if (parseInt(exp, 10) < now) {
    return false;
  }

  const expectedSig = createHmac(
    "sha256",
    Deno.env.get("SECRET_API_KEY") as string,
  )
    .update(`${src}${exp}${type}`)
    .digest("hex");

  return sig === expectedSig;
}

/**
 * Returns an HTTP response.
 * @param {URL} url - The Fetch API Request object.
 * @return {Response} The HTTP response or string.
 */
export async function handleMaster(url: URL): Promise<Response> {
  const srcURL = url.searchParams.get("src");
  const referer = url.searchParams.get("referer");

  if (!srcURL) {
    return new Response("Provide a valid url", {
      status: 400,
      statusText: "Provide a valid url",
    });
  }

  if (!srcURL.endsWith("master.m3u8")) {
    return withCORS(
      new Response("Provide a valid url of .m3u8 file", {
        status: 404,
        statusText: "Provide a valid url of .m3u8 file",
      }),
    );
  }

  try {
    const headers: Record<string, string> = {};
    if (referer) {
      headers["referer"] = referer;
    }

    const response = await fetch(srcURL, {
      headers,
    });

    if (response.ok && response.status === 200) {
      const m3u8Content = await response.text();
      if (!m3u8Content.startsWith("#EXTM3U")) {
        return withCORS(
          new Response("Can't handle raw files", {
            status: 500,
            statusText: "Can't handle raw files",
          }),
        );
      }
      const lines = m3u8Content.split("\n");

      const transformed = lines.map((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) {
          return line;
        }
        const absoluteUrl = new URL(trimmed, srcURL).href;
        console.log(absoluteUrl);
        const signedUrl = generateSignedUrl(absoluteUrl, "index");
        return referer ? `${signedUrl}&referer=${referer}` : signedUrl;
      });

      const newM3U8 = transformed.join("\n");

      return withCORS(
        new Response(newM3U8, {
          headers: {
            "Content-Type": "video/MP2T",
            "Access-Control-Allow-Origin": "*",
          },
        }),
      );
    } else {
      return withCORS(
        new Response(null, {
          status: response.status,
          statusText: response.statusText,
          headers: {
            "server-timing": response.headers.get("server-timing") as string,
          },
        }),
      );
    }
  } catch (e) {
    console.log(e);
    return withCORS(
      new Response("Server error - catch", {
        status: 500,
        statusText: "Server error - catch",
      }),
    );
  }
}

/**
 * Returns an HTTP response.
 * @param {URL} url - The Fetch API Request object.
 * @return {Response} The HTTP response or string.
 */
async function handleIndex(url: URL): Promise<Response> {
  const srcURL = url.searchParams.get("src");
  const exp = url.searchParams.get("exp");
  const sig = url.searchParams.get("sig");
  const referer = url.searchParams.get("referer");

  if (!srcURL || !exp || !sig) {
    return withCORS(
      new Response("Provide a valid src, sig and exp", {
        status: 400,
        statusText: "Provide a valid src, sig and exp",
      }),
    );
  }

  if (
    !verifySignedUrl(srcURL as string, sig as string, exp as string, "index")
  ) {
    return withCORS(
      new Response("Invalid or expired signed URL", {
        status: 400,
        statusText: "Invalid or expired signed URL",
      }),
    );
  }

  try {
    const headers: Record<string, string> = {};
    if (referer) {
      headers["referer"] = referer;
    }

    const response = await fetch(srcURL, {
      headers,
    });

    if (response.ok && response.status === 200) {
      const m3u8Content = await response.text();
      if (!m3u8Content.startsWith("#EXTM3U")) {
        return withCORS(
          new Response("Can't handle raw files", {
            status: 500,
            statusText: "Can't handle raw files",
          }),
        );
      }

      const lines = m3u8Content.split("\n");

      const transformed = lines.map((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) {
          return line;
        }

        const absoluteUrl = new URL(trimmed, srcURL).href;

        const signedUrl = generateSignedUrl(absoluteUrl, "segment");
        return referer ? `${signedUrl}&referer=${referer}` : signedUrl;
      });

      const newM3U8 = transformed.join("\n");

      return withCORS(
        new Response(newM3U8, {
          headers: {
            "Content-Type": "video/MP2T",
            // 'Access-Control-Allow-Origin': '*'
          },
        }),
      );
    } else {
      return withCORS(
        new Response(null, {
          status: response.status,
          statusText: response.statusText,
        }),
      );
    }
  } catch (e) {
    console.log(e);
    return withCORS(
      new Response("Server Error - catch", {
        status: 500,
        statusText: "Server Error - catch",
      }),
    );
  }
}

/**
 * Returns an HTTP response.
 * @param {URL} url - The Fetch API Request object.
 * @return {Response} The HTTP response or string.
 */
async function handleSegment(url: URL): Promise<Response> {
  const srcURL = url.searchParams.get("src");
  const exp = url.searchParams.get("exp");
  const sig = url.searchParams.get("sig");
  const referer = url.searchParams.get("referer");

  if (!srcURL || !exp || !sig) {
    return withCORS(
      new Response("Provide a valid src, sig and exp", {
        status: 404,
        statusText: "Provide a valid src, sig and exp",
      }),
    );
  }

  if (
    !verifySignedUrl(srcURL as string, sig as string, exp as string, "segment")
  ) {
    return withCORS(
      new Response("Invalid or expired signed URL", {
        status: 400,
        statusText: "Invalid or expired signed URL",
      }),
    );
  }

  try {
    const headers: Record<string, string> = {};
    if (referer) {
      headers["referer"] = referer;
    }

    const response = await fetch(srcURL, {
      headers,
    });
    if (response.ok && response.status === 200) {
      const segmentResp = await response.arrayBuffer();
      let contentType = response.headers.get("content-type");
      if (!contentType) {
        contentType = "application/octet-stream";
      }

      return withCORS(
        new Response(segmentResp, {
          headers: {
            "content-type": contentType,
          },
        }),
      );
    } else {
      return withCORS(
        new Response(response.statusText, {
          status: response.status,
          statusText: response.statusText,
        }),
      );
    }
  } catch (e) {
    console.log(e);
    return withCORS(
      new Response("Server error - catch", {
        status: 500,
        statusText: "Server error - catch",
      }),
    );
  }
}

/**
 * Handle OPTIONS request for CORS preflight
 */
function handleOptions(): Response {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

/**
 * Returns an HTTP response.
 * @param {Request} request - The Fetch API Request object.
 * @return {Response} The HTTP response or string.
 */
BunnySDK.net.http.serve(
  async (request: Request): Promise<Response> | Promise<Response> => {
    if (request.method === "OPTIONS") return handleOptions();

    const url = new URL(request.url);

    if (url.pathname === "/master.m3u8") {
      return handleMaster(url);
    }

    if (url.pathname === "/index.m3u8") {
      return handleIndex(url);
    }

    if (url.pathname === "/segment") {
      return handleSegment(url);
    }

    return withCORS(new Response("welcome to proxy"));
  },
);