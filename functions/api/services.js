// functions/api/services.js

function isAuthenticated(request, env) {
  const token = env.ADMIN_TOKEN || "pce_secure_token_2026";
  return request.headers.get("Authorization") === `Bearer ${token}`;
}

// GET: Fetch all ceremonies/services or a single one (?id=wedding or ?id=wedding__design)
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

// PUT: Update or Insert description for any event or event-service combination
export async function onRequestPut(context) {
  if (!isAuthenticated(context.request, context.env)) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const data = await context.request.json();
    if (!data.id || data.description === undefined) {
      return new Response(JSON.stringify({ error: "Missing ID or description" }), { status: 400 });
    }

    // UPSERT: Updates existing row or creates row if managing a sub-service for the first time
    await context.env.DB.prepare(
      `INSERT INTO services (id, title, type, description, display_order) 
       VALUES (?, ?, ?, ?, 99) 
       ON CONFLICT(id) DO UPDATE SET description = excluded.description`
    ).bind(
      data.id,
      data.title || data.id,
      data.type || "service",
      data.description
    ).run();

    return new Response(JSON.stringify({ success: true }));
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}