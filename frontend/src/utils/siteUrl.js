const DEFAULT_SITE_URL = "https://eventsphere-blond.vercel.app";

export const getPublicSiteUrl = () => {
  const fromEnv = import.meta.env.VITE_SITE_URL?.trim();

  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }

  if (typeof window !== "undefined") {
    const { hostname, origin } = window.location;

    if (hostname !== "localhost" && hostname !== "127.0.0.1") {
      return origin;
    }
  }

  return DEFAULT_SITE_URL;
};

/** Email auth links must use a public URL — never localhost (breaks on mobile). */
export const getAuthEmailRedirectUrl = () =>
  `${getPublicSiteUrl()}/auth/callback`;
