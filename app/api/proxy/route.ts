export const runtime = 'edge';

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const targetUrl = searchParams.get("url");

	if (!targetUrl) {
		return new Response("Missing `url` query param in request", { status: 400 });
	}

	try {
		// Forwarding relevant headers from the client request
		const incomingHeaders = new Headers(request.headers);
		const forwardedHeaders = new Headers();

		// Whitelist headers that make sense to forward
		const allowedRequestHeaders = ['accept', 'accept-language', 'user-agent', 'referer'];

		for (const [key, value] of incomingHeaders.entries()) {
			if (allowedRequestHeaders.includes(key.toLowerCase())) {
				forwardedHeaders.set(key, value);
			}
		}

		// Fetch the target URL
		const res = await fetch(targetUrl, {
			method: 'GET',
			headers: forwardedHeaders,
		});

		// Clone and filter response headers
		const responseHeaders = new Headers(res.headers);
		const finalHeaders = new Headers();

		// Preserve important headers only (avoid restricted or security headers)
		const safeResponseHeaders = [
			'content-type',
			'content-length',
			'cache-control',
			'expires',
			'last-modified',
			'etag',
		];

		for (const [key, value] of responseHeaders.entries()) {
			if (safeResponseHeaders.includes(key.toLowerCase())) {
				finalHeaders.set(key, value);
			}
		}

		// Set CORS headers
		finalHeaders.set("Access-Control-Allow-Origin", "*");
		finalHeaders.set("Access-Control-Allow-Methods", "GET");
		finalHeaders.set("Access-Control-Allow-Headers", "Content-Type");

		return new Response(res.body, {
			status: res.status,
			statusText: res.statusText,
			headers: finalHeaders,
		});
	} catch (err) {
		return new Response("Proxy fetch error: " + err, { status: 500 });
	}
}
