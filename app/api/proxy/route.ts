export const runtime = 'edge';

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const targetUrl = searchParams.get("url");

	if (!targetUrl) {
		return new Response("Missing `url` query param in request", { status: 400 });
	}

	try {
		// Forward whitelisted request headers
		const incomingHeaders = new Headers(request.headers);
		const forwardedHeaders = new Headers();
		const allowedRequestHeaders = ['accept', 'accept-language', 'user-agent', 'referer'];

		for (const [key, value] of incomingHeaders.entries()) {
			if (allowedRequestHeaders.includes(key.toLowerCase())) {
				forwardedHeaders.set(key, value);
			}
		}

		// Fetch target resource
		const res = await fetch(targetUrl, {
			method: 'GET',
			headers: forwardedHeaders,
		});

		// Clone response headers
		const responseHeaders = new Headers(res.headers);
		const finalHeaders = new Headers();

		// Extract content-type to decide caching
		const contentType = responseHeaders.get('content-type') || '';

		// Determine optimal Cache-Control header
		if (
			contentType.startsWith('image/') ||
			contentType.includes('font') ||
			contentType.includes('woff') ||
			contentType.includes('otf') ||
			contentType.includes('ttf')
		) {
			finalHeaders.set('Cache-Control', 'public, max-age=31536000, immutable');
		} else {
			finalHeaders.set('Cache-Control', 'public, max-age=1800');
		}

		// Preserve safe headers
		const safeResponseHeaders = [
			'content-type',
			'content-length',
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
		finalHeaders.set('Access-Control-Allow-Origin', '*');
		finalHeaders.set('Access-Control-Allow-Methods', 'GET');
		finalHeaders.set('Access-Control-Allow-Headers', 'Content-Type');

		// Return proxied response
		return new Response(res.body, {
			status: res.status,
			statusText: res.statusText,
			headers: finalHeaders,
		});
	} catch (err) {
		return new Response("Proxy fetch error: " + err, { status: 500 });
	}
}
