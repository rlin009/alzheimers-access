import { randomBytes, randomUUID } from 'node:crypto';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { alertsConfigured, alertOrigin, hash, managementKey, privateKey, subscriberId } from '@/lib/trial-monitor/security';
import { confirmationText, sendEmail } from '@/lib/trial-monitor/email';
import { validatePreferences, type Subscriber } from '@/lib/trial-monitor/model';
import { validProfileId } from '@/lib/profile';

export const runtime = 'nodejs';
const reply = (body: object, status = 200) => Response.json(body, { status, headers: { 'Cache-Control':'no-store' } });
export async function POST(request: Request) {
  try {
    if (request.headers.get('origin') !== alertOrigin()) return reply({ error:'Please use the alerts page on this site.' },403);
    const raw = await request.text();
    if (raw.length > 16000) return reply({ error:'Request too large.' },413);
    let body;
    try { body = JSON.parse(raw); } catch { return reply({ error:'Invalid request.' },400); }
    if (!body || typeof body !== 'object') return reply({ error:'Invalid request.' },400);
    const db = createServerSupabaseClient();
    if (body.action === 'subscribe') {
      if (!alertsConfigured()) return reply({ error:'Email alerts are not available yet. You can still browse trials.' },503);
      const preferences = validatePreferences(body.preferences);
      const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
      if (!preferences || body.consent !== true || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return reply({ error:'Check your email and preferences, and agree to receive the alerts.' },400);
      if (body.website) return reply({ message:'Check your inbox for a confirmation link.' });
      const ip = request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
      for (const [key, limit, seconds] of [[privateKey('email:'+email),3,3600],[privateKey('ip:'+ip),10,3600],['signup-daily',50,86400]] as const) {
        const rate = await db.rpc('trial_alert_rate_limit',{ p_key:key, p_limit:limit, p_seconds:seconds });
        if (rate.error) throw new Error('Rate limiting unavailable');
        if (!rate.data) return reply({ error:'Too many requests. Please try again later.' },429);
      }
      const follows: Record<string,string> = {};
      if (body.trial) {
        if (typeof body.trial !== 'string' || !/^NCT\d{8}$/.test(body.trial)) return reply({ error:'Invalid study ID.' },400);
        const head = await db.from('trial_monitor_head').select('run_id').eq('singleton',true).single();
        const record = await db.from('trial_monitor_records').select('payload').eq('run_id',head.data?.run_id ?? '').eq('nct_id',body.trial).maybeSingle();
        if (record.error || !record.data || record.data.payload.scope === 'exclude') return reply({ error:'This study cannot be followed yet. Try again after the next registry update.' },400);
        follows[body.trial] = new Date().toISOString();
      }
      const id = randomUUID(), token = randomBytes(32).toString('base64url');
      const saved = await db.from('trial_alert_requests').insert({ id, email, product:preferences.product, preferences, follows, token_hash:hash(token) });
      if (saved.error) throw new Error('Unable to save confirmation request');
      await sendEmail(email,'Confirm your study updates',confirmationText(preferences.product,id,token),'verify/'+id);
      return reply({ message:'Check your inbox for a confirmation link. Alerts start only after you confirm. The link expires in 24 hours.' });
    }
    if (body.action === 'verify') {
      const [id, token, extra] = typeof body.token === 'string' ? body.token.split('.') : [];
      if (!validProfileId(id) || !token || token.length !== 43 || extra) return reply({ error:'This confirmation link is invalid or expired.' },400);
      const confirmed = await db.rpc('confirm_trial_alert',{ p_id:id, p_hash:hash(token) });
      if (confirmed.error || !confirmed.data) return reply({ error:'This confirmation link was already used or has expired. Request a new link using your email below.' },400);
      return reply({ key:managementKey(confirmed.data), message:'Your email is confirmed. Your alerts are active.' });
    }
    const key = request.headers.get('authorization')?.replace(/^Bearer /,'') ?? '';
    const id = subscriberId(key);
    if (!id) return reply({ error:'Open the private manage link in your email, or request a new confirmation link.' },401);
    const result = await db.from('trial_alert_subscriptions').select('*').eq('id',id).maybeSingle();
    if (result.error) throw new Error('Unable to load subscription');
    if (!result.data) return reply({ error:'This subscription has been removed. You can sign up again below.' },404);
    const subscription = result.data as Subscriber;
    if (body.action === 'delete') {
      // Removal cascades to pending/sent notices, and revokes the management link.
      const removed = await db.rpc('delete_trial_alert',{p_subscriber:id});
      if (removed.error) throw new Error('Unable to remove subscription');
      return reply({ deleted:true, message:'You are unsubscribed. Your alert preferences, follows and stored notifications have been deleted. An email already being sent may still arrive.' });
    }
    if (body.action === 'save') {
      const preferences = validatePreferences(body.preferences);
      if (!preferences || preferences.product !== subscription.preferences.product) return reply({ error:'Please check your preferences.' },400);
      const saved = await db.rpc('save_trial_alert_preferences',{p_subscriber:id,p_preferences:preferences});
      if (saved.error) throw new Error('Unable to save preferences');
      subscription.preferences = preferences;
    }
    if (body.action === 'follow') {
      if (!/^NCT\d{8}$/.test(body.trial ?? '')) return reply({ error:'Invalid study ID.' },400);
      const head = await db.from('trial_monitor_head').select('run_id').eq('singleton',true).single();
      const record = await db.from('trial_monitor_records').select('payload').eq('run_id',head.data?.run_id ?? '').eq('nct_id',body.trial).maybeSingle();
      if (record.error || !record.data || record.data.payload.scope === 'exclude') return reply({ error:'Study unavailable in the current catalog.' },400);
      const saved = await db.rpc('follow_trial_alert',{ p_subscriber:id,p_trial:body.trial });
      if (saved.error) return reply({error:'Could not follow this study. You can follow up to 50 studies.'},400);
      subscription.follows = saved.data;
    }
    if (body.action === 'unfollow') {
      if (!/^NCT\d{8}$/.test(body.trial ?? '')) return reply({ error:'Invalid study ID.' },400);
      const saved = await db.rpc('unfollow_trial_alert',{ p_subscriber:id, p_trial:body.trial });
      if (saved.error) throw new Error('Unable to stop following');
      delete subscription.follows[body.trial];
    }
    if (!['manage','save','unfollow','follow'].includes(body.action)) return reply({ error:'Unknown action.' },400);
    const history = await db.from('trial_alert_outbox').select('id,notices,state,sent_at,run_id').eq('subscriber_id',id).order('created_at',{ascending:false}).limit(20);
    if (history.error) throw new Error('Unable to load alert history');
    return reply({ preferences:subscription.preferences, follows:subscription.follows, history:history.data, message:body.action === 'manage' ? '' : 'Saved.' });
  } catch {
    // Never log an email, profile, management credential, or provider response body.
    return reply({ error:'We couldn’t complete that request. Please try again later.' },503);
  }
}
