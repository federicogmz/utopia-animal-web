import { sha256Hex } from '../_lib/crypto';

interface Env {
  DB: D1Database;
  META_PIXEL_ID: string;
  META_ACCESS_TOKEN: string;
}

interface LeadPayload {
  event_name: 'Lead';
  event_time: number;
  event_id: string;
  action_source: 'website';
  event_source_url: string;
  user_data: {
    em?: string[];
    ph?: string[];
    fn?: string[];
    ln?: string[];
    ct?: string[];
    st?: string[];
    zp?: string[];
    country?: string[];
    client_ip_address?: string;
    client_user_agent?: string;
    fbp?: string;
    fbc?: string;
  };
  custom_data?: {
    content_name?: string;
    content_category?: string;
    value?: number;
    currency?: string;
  };
}

const ALLOWED_ORIGINS = [
  'https://utopianimal.org',
  'https://www.utopianimal.org',
  'http://localhost:4321',
];

function corsHeaders(origin: string) {
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Event-ID',
    'Access-Control-Max-Age': '86400',
  };
}

function hashNormalize(value: string): string {
  return value.trim().toLowerCase();
}

async function hashPII(value: string): Promise<string> {
  const normalized = hashNormalize(value);
  return await sha256Hex(normalized);
}

function extractFbpFbcFromCookie(cookieHeader: string | null): { fbp?: string; fbc?: string } {
  if (!cookieHeader) return {};
  const cookies = cookieHeader.split(';').map(c => c.trim());
  let fbp: string | undefined;
  let fbc: string | undefined;
  for (const cookie of cookies) {
    if (cookie.startsWith('_fbp=')) fbp = cookie.substring(5);
    if (cookie.startsWith('_fbc=')) fbc = cookie.substring(5);
  }
  return { fbp, fbc };
}

export const onRequestOptions: PagesFunction<Env> = async ({ request }) => {
  const origin = request.headers.get('Origin') || '';
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const origin = request.headers.get('Origin') || '';
  const headers = corsHeaders(origin);

  let payload: LeadPayload;
  try {
    payload = await request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'invalid_json' }), {
      status: 400,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }

  if (!payload.event_id || !payload.event_source_url) {
    return new Response(JSON.stringify({ ok: false, error: 'missing_event_id_or_url' }), {
      status: 400,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }

  const cookieHeader = request.headers.get('Cookie');
  const { fbp: cookieFbp, fbc: cookieFbc } = extractFbpFbcFromCookie(cookieHeader);
  if (!payload.user_data.fbp && cookieFbp) payload.user_data.fbp = cookieFbp;
  if (!payload.user_data.fbc && cookieFbc) payload.user_data.fbc = cookieFbc;

  const clientIp = request.headers.get('CF-Connecting-IP') || request.headers.get('x-forwarded-for') || '';
  const userAgent = request.headers.get('User-Agent') || '';
  if (clientIp) payload.user_data.client_ip_address = clientIp;
  if (userAgent) payload.user_data.client_user_agent = userAgent;

  const metaBody = {
    data: [payload],
    test_event_code: 'TEST_' + Date.now(),
  };

  try {
    const response = await fetch(
      `https://graph.facebook.com/v22.0/${env.META_PIXEL_ID}/events?access_token=${env.META_ACCESS_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metaBody),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error('Meta CAPI error:', JSON.stringify(result));
      return new Response(JSON.stringify({ ok: false, error: 'meta_error', detail: result }), {
        status: 502,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    try {
      await env.DB.prepare(`
        INSERT INTO capi_events (event_id, event_name, event_time, payload, meta_response, created_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        payload.event_id,
        payload.event_name,
        payload.event_time,
        JSON.stringify(payload),
        JSON.stringify(result)
      ).run();
    } catch (e) {
      console.warn('Failed to log CAPI event to D1:', e);
    }

    return new Response(JSON.stringify({ ok: true, meta_response: result }), {
      status: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('CAPI fetch failed:', err);
    return new Response(JSON.stringify({ ok: false, error: 'network_error' }), {
      status: 502,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }
};