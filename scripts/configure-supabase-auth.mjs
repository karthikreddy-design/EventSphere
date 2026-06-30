/**
 * Configures EventSphere Supabase auth for OTP-based email registration.
 * Requires a Supabase personal access token:
 * https://supabase.com/dashboard/account/tokens
 *
 * Usage:
 *   set SUPABASE_ACCESS_TOKEN=your_token
 *   node scripts/configure-supabase-auth.mjs
 */

const PROJECT_REF = "xyqolobjodleazrmflpt";
const SITE_URL = "https://eventsphere-blond.vercel.app";
const REDIRECT_URLS = [
  `${SITE_URL}/**`,
  "http://localhost:5173/**",
  "http://127.0.0.1:5173/**",
].join(",");

const CONFIRMATION_SUBJECT = "Your EventSphere registration code";
const CONFIRMATION_TEMPLATE = `<h2>Confirm your EventSphere registration</h2>
<p>Enter this 6-digit verification code on the EventSphere registration page:</p>
<p style="font-size: 28px; font-weight: 700; letter-spacing: 6px;">{{ .Token }}</p>
<p>This code expires in 1 hour.</p>`;

const token = process.env.SUPABASE_ACCESS_TOKEN;

if (!token) {
  console.error("Missing SUPABASE_ACCESS_TOKEN.");
  console.error("Create one at https://supabase.com/dashboard/account/tokens");
  process.exit(1);
}

const payload = {
  site_url: SITE_URL,
  uri_allow_list: REDIRECT_URLS,
  mailer_autoconfirm: false,
  external_email_enabled: true,
  mailer_otp_exp: 3600,
  mailer_otp_length: 6,
};

const urlResponse = await fetch(
  `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`,
  {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  }
);

const urlBody = await urlResponse.text();

if (!urlResponse.ok) {
  console.error(`URL config failed (${urlResponse.status}):`, urlBody);
  process.exit(1);
}

console.log("Supabase URL settings applied.");
console.log(JSON.stringify(JSON.parse(urlBody), null, 2));

const templatePayload = {
  mailer_subjects_confirmation: CONFIRMATION_SUBJECT,
  mailer_templates_confirmation_content: CONFIRMATION_TEMPLATE,
};

const templateResponse = await fetch(
  `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`,
  {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(templatePayload),
  }
);

const templateBody = await templateResponse.text();

if (!templateResponse.ok) {
  console.warn(
    `\nEmail template could not be updated via API (${templateResponse.status}).`
  );
  console.warn(templateBody);
  console.warn(
    "\nOn the free tier with default email, paste the template manually in:"
  );
  console.warn(
    "https://supabase.com/dashboard/project/xyqolobjodleazrmflpt/auth/templates"
  );
  process.exit(0);
}

console.log("\nEmail template updated for OTP registration.");
