// Cloudflare Pages Function -- handles POST /api/contact from ContactForm.astro.
// Requires a RESEND_API_KEY environment variable set in the Cloudflare Pages
// project (Settings > Environment variables). Get a free key at resend.com;
// the onboarding@resend.dev sender works immediately with no domain setup,
// though verifying sandelichexpertwitness.com with Resend later will get
// these emails out of "sent via resend.dev" territory.

interface Env {
  RESEND_API_KEY: string;
}

interface Context {
  request: Request;
  env: Env;
}

const DESTINATION_EMAIL = "Sandelich.MD@gmail.com";

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// Typed as a plain object (not @cloudflare/workers-types' PagesFunction) so
// this has no dependency beyond what Astro's own tsconfig already provides.
// Cloudflare Pages only cares that `onRequestPost` is exported with this
// (request, env) shape -- the exact type name isn't part of the contract.
export const onRequestPost = async ({ request, env }: Context): Promise<Response> => {
  let data: Record<string, unknown>;
  try {
    data = await request.json();
  } catch {
    return json({ error: "Invalid submission." }, 400);
  }

  const fullName = String(data["full-name"] ?? "").trim();
  const email = String(data["email"] ?? "").trim();
  const phone = String(data["phone"] ?? "").trim();
  const reason = String(data["reason"] ?? "").trim();
  const message = String(data["message"] ?? "").trim();
  const consent = Boolean(data["consent"]);

  if (!fullName || !email || !message) {
    return json({ error: "Name, email, and case details are required." }, 400);
  }
  // Minimal shape check -- real validation (MX lookup etc.) isn't worth it here.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: "That email address doesn't look right." }, 400);
  }

  const emailBody = [
    `Name: ${fullName}`,
    `Email: ${email}`,
    `Phone: ${phone || "(not provided)"}`,
    `Reason: ${reason || "(not selected)"}`,
    `Consent to store info: ${consent ? "Yes" : "No"}`,
    "",
    "Case details:",
    message,
  ].join("\n");

  // .trim() guards against a stray newline/space from copy-pasting the key
  // into Cloudflare's dashboard -- an invalid header value throws in a way
  // that can crash the Function before the outer try/catch runs.
  const apiKey = (env.RESEND_API_KEY ?? "").trim();
  if (!apiKey) {
    console.error("RESEND_API_KEY is not set in this environment");
    return json({ error: "Email is not configured yet. Please email directly." }, 500);
  }

  try {
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Sandelich Expert Witness Site <onboarding@resend.dev>",
        to: DESTINATION_EMAIL,
        reply_to: email,
        subject: `New case inquiry from ${fullName}`,
        text: emailBody,
      }),
    });

    if (!resendResponse.ok) {
      const detail = await resendResponse.text();
      console.error("Resend send failed:", resendResponse.status, detail);
      return json(
        { error: "Could not send your message right now. Please email directly.", detail },
        502,
      );
    }

    return json({ ok: true }, 200);
  } catch (err) {
    console.error("Unexpected error sending via Resend:", err);
    return json(
      { error: "Unexpected server error. Please email directly.", detail: String(err) },
      500,
    );
  }
};
