// functions/api/inquiries.js

function isAuthenticated(request, env) {
  const token = env.ADMIN_TOKEN || "pce_secure_token_2026";
  return request.headers.get("Authorization") === `Bearer ${token}`;
}

// GET: View all inquiries (Admin Only)
export async function onRequestGet(context) {
  if (!isAuthenticated(context.request, context.env)) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const { results } = await context.env.DB.prepare(
      "SELECT * FROM inquiries ORDER BY created_at DESC"
    ).all();

    return new Response(JSON.stringify(results), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

// POST: Public submission from booking form
export async function onRequestPost(context) {
  try {
    const data = await context.request.json();

    if (!data.user_name || !data.phone_number) {
      return new Response(JSON.stringify({ error: "Name and phone number are required" }), { status: 400 });
    }

    await context.env.DB.prepare(
      "INSERT INTO inquiries (user_name, phone_number, event_type, message) VALUES (?, ?, ?, ?)"
    ).bind(
      data.user_name,
      data.phone_number,
      data.event_type || "Other",
      data.message || ""
    ).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

// DELETE: Remove an inquiry (Admin Only)
export async function onRequestDelete(context) {
  if (!isAuthenticated(context.request, context.env)) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const url = new URL(context.request.url);
    const id = url.searchParams.get("id");

    await context.env.DB.prepare("DELETE FROM inquiries WHERE id = ?").bind(id).run();

    return new Response(JSON.stringify({ success: true }));
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}