const CLIENT_ID = process.env.GOOGLE_CALENDAR_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;
const SCOPE = "https://www.googleapis.com/auth/calendar";
const REVALIDATE_SECONDS = 600;

export function isGoogleCalendarOAuthConfigured(): boolean {
  return Boolean(CLIENT_ID && CLIENT_SECRET);
}

export function getRedirectUri(): string {
  const base = process.env.NEXTAUTH_URL ?? "https://www.useventful.com";
  return `${base}/api/google-calendar/callback`;
}

export function buildAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: CLIENT_ID ?? "",
    redirect_uri: getRedirectUri(),
    response_type: "code",
    scope: SCOPE,
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export type GoogleTokens = {
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
};

export async function exchangeCodeForTokens(code: string): Promise<GoogleTokens> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: CLIENT_ID ?? "",
      client_secret: CLIENT_SECRET ?? "",
      redirect_uri: getRedirectUri(),
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) {
    throw new Error(`Token exchange failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
  };
}

async function refreshAccessToken(
  refreshToken: string
): Promise<{ accessToken: string; expiresAt: Date }> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: CLIENT_ID ?? "",
      client_secret: CLIENT_SECRET ?? "",
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    throw new Error(`Token refresh failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return {
    accessToken: data.access_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
  };
}

type TenantTokenFields = {
  id: string;
  googleCalendarAccessToken: string | null;
  googleCalendarRefreshToken: string | null;
  googleCalendarTokenExpiresAt: Date | null;
};

/** Returns a valid access token for the tenant, refreshing (and persisting) it if expired. */
export async function getValidAccessToken(tenant: TenantTokenFields): Promise<string | null> {
  if (!tenant.googleCalendarAccessToken || !tenant.googleCalendarRefreshToken) return null;

  const expiresAt = tenant.googleCalendarTokenExpiresAt;
  const needsRefresh = !expiresAt || expiresAt.getTime() - Date.now() < 60_000;
  if (!needsRefresh) return tenant.googleCalendarAccessToken;

  try {
    const refreshed = await refreshAccessToken(tenant.googleCalendarRefreshToken);
    const { prisma } = await import("@/lib/prisma");
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        googleCalendarAccessToken: refreshed.accessToken,
        googleCalendarTokenExpiresAt: refreshed.expiresAt,
      },
    });
    return refreshed.accessToken;
  } catch (err) {
    console.error("[gcal-oauth] refresh failed:", err);
    return null;
  }
}

export type GoogleCalendarListEntry = { id: string; summary: string; primary: boolean };

export async function listCalendars(accessToken: string): Promise<GoogleCalendarListEntry[]> {
  const res = await fetch(
    "https://www.googleapis.com/calendar/v3/users/me/calendarList?minAccessRole=writer",
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) throw new Error(`Failed to list calendars: ${res.status}`);
  const data = await res.json();
  return (data.items ?? []).map((item: { id: string; summary: string; primary?: boolean }) => ({
    id: item.id,
    summary: item.summary,
    primary: item.primary ?? false,
  }));
}

export type GoogleApiEvent = {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  htmlLink?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
};

export async function listEvents(
  accessToken: string,
  calendarId: string,
  timeMin: Date,
  timeMax: Date,
  tenantId: string
): Promise<GoogleApiEvent[]> {
  const params = new URLSearchParams({
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "250",
  });
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      next: { revalidate: REVALIDATE_SECONDS, tags: [`gcal-${tenantId}`] },
    }
  );
  if (!res.ok) throw new Error(`Failed to list events: ${res.status}`);
  const data = await res.json();
  return data.items ?? [];
}

export async function insertEvent(
  accessToken: string,
  calendarId: string,
  event: {
    summary: string;
    description?: string | null;
    location?: string | null;
    start: Date;
    end: Date;
  }
): Promise<{ id: string; htmlLink: string }> {
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: event.summary,
        description: event.description ?? undefined,
        location: event.location ?? undefined,
        start: { dateTime: event.start.toISOString() },
        end: { dateTime: event.end.toISOString() },
      }),
    }
  );
  if (!res.ok) throw new Error(`Failed to insert event: ${res.status} ${await res.text()}`);
  return res.json();
}
