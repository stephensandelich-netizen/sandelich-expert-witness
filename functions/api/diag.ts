// Temporary diagnostic endpoint -- delete once the contact form 502 is resolved.
// Tests whether outbound fetch works at all from this Pages Function, and
// separately whether the Resend API specifically is reachable, without any
// of the contact.ts logic in the way.

interface Env {
  RESEND_API_KEY: string;
}

export const onRequestGet = async ({ env }: { env: Env }): Promise<Response> => {
  const result: Record<string, unknown> = {
    hasApiKey: Boolean(env.RESEND_API_KEY),
    apiKeyLength: env.RESEND_API_KEY ? env.RESEND_API_KEY.length : 0,
  };

  try {
    const basicFetch = await fetch("https://example.com");
    result.basicFetchStatus = basicFetch.status;
    result.basicFetchOk = basicFetch.ok;
  } catch (err) {
    result.basicFetchError = String(err);
  }

  try {
    const resendPing = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${(env.RESEND_API_KEY ?? "").trim()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Diagnostic <onboarding@resend.dev>",
        to: "Sandelich.MD@gmail.com",
        subject: "Diagnostic ping",
        text: "diagnostic",
      }),
    });
    result.resendStatus = resendPing.status;
    result.resendOk = resendPing.ok;
    result.resendBody = await resendPing.text();
  } catch (err) {
    result.resendError = String(err);
    result.resendErrorName = err instanceof Error ? err.name : typeof err;
  }

  return new Response(JSON.stringify(result, null, 2), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
