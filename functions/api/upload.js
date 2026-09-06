// functions/api/upload.js

function isAuthenticated(request, env) {
  const token = env.ADMIN_TOKEN || "pce_secure_token_2026";
  return request.headers.get("Authorization") === `Bearer ${token}`;
}

export async function onRequestPost(context) {
  if (!isAuthenticated(context.request, context.env)) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const formData = await context.request.formData();
    const file = formData.get("image");

    if (!file) {
      return new Response(JSON.stringify({ error: "No image file provided" }), { status: 400 });
    }

    // Generate unique sanitized filename
    const cleanFileName = file.name.toLowerCase().replace(/[^a-z0-9.]/g, "-");
    const objectKey = `${Date.now()}-${cleanFileName}`;

    // Upload to Cloudflare R2
    await context.env.BUCKET.put(objectKey, file.stream(), {
      httpMetadata: { contentType: file.type || "image/jpeg" }
    });

    // Public URL: will use your custom domain or R2 public endpoint
    const r2Domain = context.env.R2_PUBLIC_DOMAIN || "https://pub-93ff578150c84aeb85edcc3403959d9b.r2.dev";
    const publicUrl = `${r2Domain.replace(/\/$/, '')}/${objectKey}`;

    return new Response(JSON.stringify({ url: publicUrl, key: objectKey }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}