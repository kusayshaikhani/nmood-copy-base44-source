import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const resendApiKey = Deno.env.get('RESEND_API_KEY') ?? '';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://app.nmood.app',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[character] ?? character));

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  if (!supabaseUrl || !anonKey || !serviceRoleKey || !resendApiKey) return json({ error: 'service_unavailable' }, 503);

  const authorization = request.headers.get('authorization') ?? '';
  const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } });
  const { data: authData } = await userClient.auth.getUser();
  const caller = authData.user;
  if (!caller) return json({ error: 'not_authorized' }, 401);

  let payload: { event?: string; request_id?: string };
  try {
    payload = await request.json();
  } catch {
    return json({ error: 'invalid_body' }, 400);
  }

  const event = payload.event;
  const requestId = String(payload.request_id ?? '');
  if (!requestId || !['pal_request_created', 'pal_request_accepted'].includes(String(event))) {
    return json({ error: 'invalid_notification' }, 400);
  }

  const service = createClient(supabaseUrl, serviceRoleKey);
  const { data: palRequest, error: requestError } = await service
    .from('pal_requests')
    .select('id, sender_id, receiver_id, status')
    .eq('id', requestId)
    .single();
  if (requestError || !palRequest) return json({ error: 'request_not_found' }, 404);

  const isNewRequest = event === 'pal_request_created';
  const authorized = isNewRequest
    ? caller.id === palRequest.sender_id && palRequest.status === 'pending'
    : caller.id === palRequest.receiver_id && palRequest.status === 'accepted';
  if (!authorized) return json({ error: 'not_authorized' }, 403);

  const recipientId = isNewRequest ? palRequest.receiver_id : palRequest.sender_id;
  const notificationKey = `${event}:${palRequest.id}`;
  const { error: deliveryError } = await service.from('notification_deliveries').insert({
    notification_key: notificationKey,
    request_id: palRequest.id,
    event_type: event,
    recipient_id: recipientId,
  });
  if (deliveryError?.code === '23505') return json({ ok: true, duplicate: true });
  if (deliveryError) return json({ error: 'delivery_unavailable' }, 503);

  const [{ data: actor }, { data: recipientUser, error: recipientError }] = await Promise.all([
    service.from('members').select('display_name').eq('id', caller.id).single(),
    service.auth.admin.getUserById(recipientId),
  ]);
  const recipientEmail = recipientUser?.user?.email;
  if (recipientError || !recipientEmail) {
    await service.from('notification_deliveries').delete().eq('notification_key', notificationKey);
    return json({ error: 'recipient_unavailable' }, 422);
  }

  const actorName = escapeHtml(actor?.display_name?.trim() || 'A Nmood member');
  const subject = isNewRequest ? `${actorName} sent you a pal request` : `${actorName} accepted your pal request`;
  const message = isNewRequest
    ? `${actorName} would like to connect with you on Nmood.`
    : `You and ${actorName} are now pals on Nmood.`;

  const resendResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': notificationKey,
    },
    body: JSON.stringify({
      from: 'Nmood <no-reply@nmood.app>',
      to: [recipientEmail],
      subject,
      html: `<h1>Nmood</h1><p>${message}</p><p><a href="https://app.nmood.app">Open Nmood</a></p>`,
      text: `Nmood\n\n${message}\n\nOpen Nmood: https://app.nmood.app`,
    }),
  });

  if (!resendResponse.ok) {
    await service.from('notification_deliveries').delete().eq('notification_key', notificationKey);
    return json({ error: 'email_not_sent' }, 502);
  }

  const resend = await resendResponse.json().catch(() => ({}));
  await service.from('notification_deliveries').update({
    sent_at: new Date().toISOString(),
    resend_email_id: typeof resend.id === 'string' ? resend.id : null,
  }).eq('notification_key', notificationKey);

  return json({ ok: true });
});
