// functions/api/auth.js

export async function onRequestPost(context) {
  try {
    const data = await context.request.json();
    const ADMIN_PASSWORD = context.env.ADMIN_PASSWORD || "PCEAdmin2026";
    const ADMIN_TOKEN = context.env.ADMIN_TOKEN || "pce_secure_token_2026";

    if (data.password === ADMIN_PASSWORD) {
      return new Response(JSON.stringify({ success: true, token: ADMIN_TOKEN }), {
        headers: { "Content-Type": "application/json" }
      });
    } else {
      return new Response(JSON.stringify({ error: "Incorrect password" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}