/**
 * Configures EventSphere Supabase auth for immediate registration (no email OTP).
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

const token = process.env.SUPABASE_ACCESS_TOKEN;

if (!token) {
  console.error("Missing SUPABASE_ACCESS_TOKEN.");
  console.error("Create one at https://supabase.com/dashboard/account/tokens");
  process.exit(1);
}

const payload = {
  site_url: SITE_URL,
  uri_allow_list: REDIRECT_URLS,
  mailer_autoconfirm: true,
  external_email_enabled: true,
};

const response = await fetch(
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

const body = await response.text();

if (!response.ok) {
  console.error(`Auth config failed (${response.status}):`, body);
  process.exit(1);
}

console.log("Supabase auth configured for auto-confirmed registration.");
console.log(JSON.stringify(JSON.parse(body), null, 2));
