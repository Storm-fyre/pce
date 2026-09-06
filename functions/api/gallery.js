// functions/api/gallery.js

function isAuthenticated(request, env) {
  const token = env.ADMIN_TOKEN || "pce_secure_token_2026";
  return request.headers.get("Authorization") === `Bearer ${token}`;
}

// GET: Retrieve photos (?service_id=wedding or ?highlights=1)
export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);
    const serviceId = url.searchParams.get("service_id");
    const isHighlight = url.searchParams.get("highlights");

    let query = "SELECT * FROM gallery_photos";
    const params = [];

    if (isHighlight === "1") {
      query += " WHERE is_highlight = 1 ORDER BY created_at DESC";
      const { results } = await context.env.DB.prepare(query).all();
      return new Response(JSON.stringify(results), { headers: { "Content-Type": "application/json" } });
    }

    if (serviceId) {
      query += " WHERE service_id = ? ORDER BY created_at DESC";
      params.push(serviceId);
      const { results } = await context.env.DB.prepare(query).bind(...params).all();
      return new Response(JSON.stringify(results), { headers: { "Content-Type": "application/json" } });
    }

    // Default: Return all photos
    query += " ORDER BY created_at DESC";
    const { results } = await context.env.DB.prepare(query).all();
    return new Response(JSON.stringify(results), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

// POST: Add new photo to a ceremony
export async function onRequestPost(context) {
  if (!isAuthenticated(context.request, context.env)) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const data = await context.request.json();
    const isHighlight = data.is_highlight ? 1 : 0;

    await context.env.DB.prepare(
      "INSERT INTO gallery_photos (service_id, image_url, caption, is_highlight) VALUES (?, ?, ?, ?)"
    ).bind(data.service_id, data.image_url, data.caption || "", isHighlight).run();

    return new Response(JSON.stringify({ success: true }));
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

// PUT: Toggle Highlight status (Show/Hide on Homepage "Our Highlights")
export async function onRequestPut(context) {
  if (!isAuthenticated(context.request, context.env)) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const data = await context.request.json();
    await context.env.DB.prepare(
      "UPDATE gallery_photos SET is_highlight = ? WHERE id = ?"
    ).bind(data.is_highlight ? 1 : 0, data.id).run();

    return new Response(JSON.stringify({ success: true }));
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

// DELETE: Delete photo record and purge the object from Cloudflare R2
export async function onRequestDelete(context) {
  if (!isAuthenticated(context.request, context.env)) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const url = new URL(context.request.url);
    const id = url.searchParams.get("id");

    // 1. Fetch photo to get its URL for R2 cleanup
    const { results } = await context.env.DB.prepare(
      "SELECT image_url FROM gallery_photos WHERE id = ?"
    ).bind(id).all();

    if (results.length > 0 && results[0].image_url) {
      try {
        const urlObj = new URL(results[0].image_url);
        const objectKey = decodeURIComponent(urlObj.pathname.replace(/^\/+/, ""));
        if (objectKey) {
          await context.env.BUCKET.delete(objectKey);
        }
      } catch (err) {
        console.error("Failed to delete image from R2:", err);
      }
    }

    // 2. Delete from D1 Database
    await context.env.DB.prepare("DELETE FROM gallery_photos WHERE id = ?").bind(id).run();

    return new Response(JSON.stringify({ success: true }));
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}