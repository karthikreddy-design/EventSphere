const EMAIL_PATTERN =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "guerrillamail.com",
  "guerrillamail.net",
  "tempmail.com",
  "temp-mail.org",
  "10minutemail.com",
  "yopmail.com",
  "throwaway.email",
  "fakeinbox.com",
  "sharklasers.com",
  "trashmail.com",
  "getnada.com",
  "dispostable.com",
  "maildrop.cc",
  "tempail.com",
  "emailondeck.com",
]);

const INVALID_DOMAINS = new Set([
  "example.com",
  "example.org",
  "test.com",
  "fake.com",
  "invalid.com",
  "notreal.com",
  "localhost",
]);

export const validateRegistrationEmail = (email) => {
  const normalized = email.trim().toLowerCase();

  if (!normalized) {
    return { valid: false, message: "Email does not exist" };
  }

  if (!EMAIL_PATTERN.test(normalized)) {
    return { valid: false, message: "Email does not exist" };
  }

  const domain = normalized.split("@")[1];

  if (!domain || !domain.includes(".")) {
    return { valid: false, message: "Email does not exist" };
  }

  if (DISPOSABLE_DOMAINS.has(domain) || INVALID_DOMAINS.has(domain)) {
    return { valid: false, message: "Email does not exist" };
  }

  return { valid: true, email: normalized };
};
