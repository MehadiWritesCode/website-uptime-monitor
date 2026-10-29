export type RecentCheck = { ok: boolean; ms: number | null };

export type EndpointView = {
  id: string;
  path: string;
  method: string;
  isActive: boolean;
  status: string;
  intervalMinutes: number;
  timeoutSeconds: number;
  expectedStatus: number;
  failureThreshold: number;
  keyword: string | null;
  lastChecked: string;
  checks24h: number;
  ok24h: number;
  uptime24h: number | null;
  avgMs24h: number | null;
  recent: RecentCheck[]; // oldest -> newest
};

export type SiteView = {
  id: string;
  name: string;
  baseUrl: string;
  endpoints: EndpointView[];
};
