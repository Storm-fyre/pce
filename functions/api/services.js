// functions/api/services.js

function isAuthenticated(request, env) {
  const token = env.ADMIN_TOKEN || "pce_secure_token_2026";
  return request.headers.get("Authorization") === `Bearer ${token}`;
}

// GET: Fetch all ceremonies/services or a single one (?id=wedding)
export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);
    const serviceId = url.searchParams.get("id");

    if (serviceId) {
      const { results } = await context.env.DB.prepare(
        "SELECT * FROM services WHERE id = ?"
      ).bind(serviceId).all();
      return new Response(JSON.stringify(results[0] || null), {
        headers: { "Content-Type": "application/json" }
      });
    }

    const { results } = await context.env.DB.prepare(
      "SELECT * FROM services ORDER BY display_order ASC"
    ).all();

    return new Response(JSON.stringify(results), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

// PUT: Update description or details of a ceremony
export async function onRequestPut(context) {
  if (!isAuthenticated(context.request, context.env)) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const data = await context.request.json();
    if (!data.id || !data.description) {
      return new Response(JSON.stringify({ error: "Missing ID or description" }), { status: 400 });
    }

    await context.env.DB.prepare(
      "UPDATE services SET description = ? WHERE id = ?"
    ).bind(data.description, data.id).run();

    return new Response(JSON.stringify({ success: true }));
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}