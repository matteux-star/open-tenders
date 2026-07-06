export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, stripe-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

export function jsonResponse(
  body: unknown,
  init: ResponseInit = {}
) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
      ...init.headers,
    },
  })
}

export function ok<T>(data: T, init: ResponseInit = {}) {
  return jsonResponse({ data, error: null }, init)
}

export function fail(message: string, status = 400) {
  return jsonResponse({ data: null, error: { message } }, { status })
}

export function handleOptions(req: Request) {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  return null
}
