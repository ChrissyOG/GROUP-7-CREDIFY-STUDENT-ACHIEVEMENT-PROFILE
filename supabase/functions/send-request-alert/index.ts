import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

type RequestKind = "recommendation" | "verification";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char] ?? char);

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (request.method !== "POST") {
    return json({ error: "Method not allowed." }, 405);
  }

  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return json({ error: "Sign in before sending an email alert." }, 401);
  }

  let payload: { kind?: unknown; request_id?: unknown };
  try {
    payload = await request.json();
  } catch {
    return json({ error: "Invalid request body." }, 400);
  }

  const kind = payload.kind;
  const requestId = payload.request_id;
  if (
    (kind !== "recommendation" && kind !== "verification") ||
    typeof requestId !== "string" ||
    requestId.length === 0 ||
    requestId.length > 100
  ) {
    return json({ error: "A valid request type and request ID are required." }, 400);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const fromEmail = Deno.env.get("ALERT_FROM_EMAIL");
  const appUrlValue = Deno.env.get("APP_URL");
  if (!supabaseUrl || !anonKey || !serviceRoleKey || !resendApiKey || !fromEmail || !appUrlValue) {
    console.error("Email alert function is missing required environment configuration.");
    return json({ error: "Email alerts are not configured. Contact the administrator." }, 503);
  }

  let appUrl: URL;
  try {
    appUrl = new URL(appUrlValue);
    if (appUrl.protocol !== "https:" && appUrl.hostname !== "localhost") {
      return json({ error: "APP_URL must use HTTPS." }, 503);
    }
    appUrl.search = "";
    appUrl.hash = "";
  } catch {
    return json({ error: "APP_URL is not a valid web address." }, 503);
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: authData, error: authError } = await userClient.auth.getUser();
  if (authError || !authData.user) {
    return json({ error: "Your session is invalid or has expired. Sign in again." }, 401);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: requester, error: requesterError } = await admin
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", authData.user.id)
    .maybeSingle();
  if (requesterError) {
    console.error("Could not verify the requesting profile:", requesterError.message);
    return json({ error: "Could not verify your account." }, 500);
  }
  if (!requester || requester.role !== "student") {
    return json({ error: "Only students can send request alerts." }, 403);
  }

  const table = kind === "recommendation" ? "recommendation_requests" : "achievements";
  const columns = kind === "recommendation"
    ? "id, student_id, lecturer_id, purpose, due_on, status"
    : "id, student_id, lecturer_id, title, category, achieved_on, status";
  const { data: studentRequest, error: requestError } = await admin
    .from(table)
    .select(columns)
    .eq("id", requestId)
    .maybeSingle();
  if (requestError) {
    console.error("Could not load the request for its alert:", requestError.message);
    return json({ error: "Could not verify the submitted request." }, 500);
  }
  if (
    !studentRequest ||
    studentRequest.student_id !== authData.user.id ||
    studentRequest.status !== (kind === "recommendation" ? "requested" : "pending")
  ) {
    return json({ error: "This request is not available for an email alert." }, 404);
  }

  const { data: lecturer, error: lecturerError } = await admin
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", studentRequest.lecturer_id)
    .maybeSingle();
  if (lecturerError) {
    console.error("Could not verify the lecturer profile:", lecturerError.message);
    return json({ error: "Could not verify the selected lecturer." }, 500);
  }
  if (!lecturer || lecturer.role !== "lecturer") {
    return json({ error: "The selected lecturer account could not be found." }, 404);
  }

  const { data: lecturerAuth, error: lecturerAuthError } = await admin.auth.admin.getUserById(lecturer.id);
  if (lecturerAuthError) {
    console.error("Could not load the lecturer email:", lecturerAuthError.message);
    return json({ error: "Could not look up the lecturer's email address." }, 500);
  }
  const recipient = lecturerAuth.user?.email;
  if (!recipient) {
    return json({ error: "The selected lecturer does not have an email address on file." }, 422);
  }

  const { data: alertId, error: claimError } = await admin.rpc("claim_request_email_alert", {
    p_request_kind: kind,
    p_request_id: String(studentRequest.id),
    p_requester_id: authData.user.id,
    p_lecturer_id: lecturer.id,
    p_recipient_email: recipient,
  });
  if (claimError) {
    console.error("Could not claim the email alert:", claimError.message);
    return json({ error: "Could not prepare the email alert." }, 500);
  }
  if (!alertId) {
    const { data: existingAlert, error: existingAlertError } = await admin
      .from("request_email_alerts")
      .select("status")
      .eq("request_kind", kind)
      .eq("request_id", String(studentRequest.id))
      .maybeSingle();
    if (existingAlertError) {
      console.error("Could not check the existing email alert:", existingAlertError.message);
      return json({ error: "Could not check the email alert status." }, 500);
    }
    if (existingAlert?.status === "sent") {
      return json({ sent: false, duplicate: true });
    }
    return json({ error: "An email alert for this request is already being processed." }, 409);
  }

  const isRecommendation = kind === "recommendation";
  const subject = isRecommendation
    ? `Credify: recommendation request from ${requester.full_name}`
    : `Credify: achievement awaiting your verification`;
  const detail = isRecommendation
    ? `Recommendation request: ${escapeHtml(String(studentRequest.purpose))}<br>Needed by: ${escapeHtml(String(studentRequest.due_on))}`
    : `Achievement: ${escapeHtml(String(studentRequest.title))}<br>Category: ${escapeHtml(String(studentRequest.category))}`;
  const link = new URL("/", appUrl);
  link.searchParams.set("alert", kind);
  link.searchParams.set("request_id", String(studentRequest.id));
  const appLink = link.toString();
  const html = `<p>Hello ${escapeHtml(String(lecturer.full_name))},</p><p>${escapeHtml(String(requester.full_name))} sent you a ${isRecommendation ? "recommendation" : "achievement verification"} request on Credify.</p><p>${detail}</p><p><a href="${escapeHtml(appLink)}">Sign in to Credify to review the request</a></p>`;
  const text = `Hello ${lecturer.full_name},\n\n${requester.full_name} sent you a ${isRecommendation ? "recommendation" : "achievement verification"} request on Credify.\n${isRecommendation ? `Purpose: ${studentRequest.purpose}\nNeeded by: ${studentRequest.due_on}` : `Achievement: ${studentRequest.title}\nCategory: ${studentRequest.category}`}\n\nSign in to Credify to review the request: ${appLink}`;

  const { error: sendError } = await admin
    .from("request_email_alerts")
    .update({ status: "sending", updated_at: new Date().toISOString() })
    .eq("id", alertId);
  if (sendError) {
    console.error("Could not update email alert state:", sendError.message);
    return json({ error: "Could not prepare the email alert." }, 500);
  }

  let emailResponse: Response;
  try {
    emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: fromEmail, to: [recipient], subject, html, text }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Email provider request failed.";
    const { error: updateError } = await admin
      .from("request_email_alerts")
      .update({ status: "failed", error_message: message, updated_at: new Date().toISOString() })
      .eq("id", alertId);
    if (updateError) console.error("Could not record email delivery failure:", updateError.message);
    console.error("Email provider request failed:", message);
    return json({ error: "The request was saved, but the email provider could not send the alert." }, 502);
  }
  if (!emailResponse.ok) {
    const responseText = await emailResponse.text();
    const message = `Email provider returned ${emailResponse.status}: ${responseText.slice(0, 500)}`;
    const { error: updateError } = await admin
      .from("request_email_alerts")
      .update({ status: "failed", error_message: message, updated_at: new Date().toISOString() })
      .eq("id", alertId);
    if (updateError) console.error("Could not record email delivery failure:", updateError.message);
    console.error(message);
    return json({ error: "The request was saved, but the email provider could not send the alert." }, 502);
  }

  const { error: sentError } = await admin
    .from("request_email_alerts")
    .update({ status: "sent", sent_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", alertId);
  if (sentError) {
    console.error("Email sent but delivery state could not be recorded:", sentError.message);
  }
  return json({ sent: true });
});
