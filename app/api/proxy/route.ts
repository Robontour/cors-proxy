export const runtime = "edge";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const targetUrl = searchParams.get("url");

	if (!targetUrl) {
		return new Response("Missing `url` query param in request", { status: 400 });
	}

	try {
		const res = await fetch(targetUrl, {
			headers: {
				"User-Agent": "Vercel-Edge-Proxy",
			},
		});

		const contentType = res.headers.get("content-type") || "text/plain";
		const body = await res.text();

		return new Response(body, {
			status: res.status,
			headers: {
				"Content-Type": contentType,
				"Cache-Control": "public, max-age=1800", 
				"Access-Control-Allow-Origin": "*", 
				"Access-Control-Allow-Methods": "GET",
			},
		});
	} catch (err) {
		return new Response("Error fetching target URL" + err, { status: 500 });
	}
}
