import { config } from 'dotenv';
config({ path:'.env.local', quiet:true });
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { collectRegistry } from '../src/lib/trial-monitor/registry';
import { loadSnapshot, loadSubscribers } from '../src/lib/trial-monitor/store';
import { noticesFor, type Notice, type Snapshot, type Subscriber } from '../src/lib/trial-monitor/model';
import { alertText, sendEmail } from '../src/lib/trial-monitor/email';
import { alertsConfigured } from '../src/lib/trial-monitor/security';
import type { TrialCriteria } from '../src/lib/triage';

async function main() {
  if (process.argv.includes('--registry-only')) {
    const trials=await collectRegistry([],[],new Date().toISOString());
    console.log(JSON.stringify({records:trials.length,included:trials.filter(t=>t.scope==='include').length,review:trials.filter(t=>t.scope==='review').length,burp:trials.filter(t=>t.scope==='include' && t.conditions.some(c=>c!=='Alzheimer’s / dementia')).length}));
    console.log('Public registry read only. No database access or emails.'); return;
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Database configuration is missing.');
  const db = createClient(url,key,{ auth:{ persistSession:false,autoRefreshToken:false } });
  const apply = process.argv.includes('--apply');
  const previous = await loadSnapshot(db);
  // A missing migration fails this read even in audit mode; it never silently sends.
  const subscribers = await loadSubscribers(db);
  const checkedAt = new Date().toISOString();
  const trials = await collectRegistry(previous?.trials ?? [],subscribers.flatMap(s=>Object.keys(s.follows)),checkedAt);
  // Preserve independently parsed criteria only when their source text is identical.
  for (let i=0;i<trials.length;i+=100) {
    const result = await db.from('trials').select('nct_id,eligibility_text,criteria(*)').in('nct_id',trials.slice(i,i+100).map(t=>t.id));
    if (result.error) throw new Error('Could not verify existing criteria source text.');
    for (const old of result.data ?? []) {
      const trial = trials.find(t=>t.id===old.nct_id)!;
      if (old.eligibility_text === trial.trial.eligibility_text) trial.trial.criteria = old.criteria as TrialCriteria[];
    }
  }
  const snapshot: Snapshot = { id:randomUUID(),checkedAt,trials };
  const notices = alertsConfigured() ? subscribers.map(s=>({ subscriber_id:s.id,notices:noticesFor(s,previous,snapshot) })).filter(n=>n.notices.length) : [];
  console.log(`Complete registry check: ${trials.length} records; ${notices.length} subscribers with changes. ${previous ? '' : 'First-run baseline: no alerts.'}`);
  if (!apply) { console.log('Audit only: no database writes or email.'); return; }
  const created = await db.from('trial_monitor_runs').insert({ id:snapshot.id,checked_at:checkedAt,record_count:trials.length });
  if (created.error) throw new Error('Unable to stage registry run.');
  for (let i=0;i<trials.length;i+=50) {
    const saved = await db.from('trial_monitor_records').insert(trials.slice(i,i+50).map(t=>({ run_id:snapshot.id,nct_id:t.id,payload:t })));
    if (saved.error) throw new Error('Snapshot write failed; previous publication retained.');
  }
  const published = await db.rpc('publish_trial_monitor',{ p_run:snapshot.id,p_previous:previous?.id ?? null,p_notices:notices });
  if (published.error) throw new Error('Snapshot publication failed; previous publication retained.');
  console.log('Published complete snapshot.');
  // Keep the newest two full payload sets; history keeps concise changes, not daily copies of every record.
  let cleanup = db.from('trial_monitor_records').delete().neq('run_id',snapshot.id);
  if (previous) cleanup = cleanup.neq('run_id',previous.id);
  if ((await cleanup).error) throw new Error('Old snapshot cleanup failed.');
  if ((await db.from('trial_alert_outbox').delete().in('state',['sent','cancelled']).lt('created_at',new Date(Date.now()-90*86400000).toISOString())).error) throw new Error('Old alert history cleanup failed.');
  if ((await db.from('trial_alert_outbox').update({state:'cancelled'}).eq('state','queued').lt('created_at',new Date(Date.now()-48*3600000).toISOString())).error) throw new Error('Stale queue cleanup failed.');
  // Purge expired verification requests and obsolete anonymous rate-limit keys.
  for (const table of ['trial_alert_requests','trial_alert_limits']) {
    const cleaned = await db.from(table).delete().lt('expires_at',new Date().toISOString());
    if (cleaned.error) throw new Error('Expired alert data could not be removed.');
  }
  if (!alertsConfigured()) { console.log('Email delivery is disabled. Configure and test it before enabling signup.'); return; }
  const outbox = await db.from('trial_alert_outbox').select('id,subscriber_id,notices,run_id').in('state',['queued','sending']).order('id').limit(500);
  if (outbox.error) throw new Error('Unable to load queued alerts.');
  let failures = 0, sent = 0;
  for (const item of outbox.data ?? []) {
    const claimed = await db.rpc('claim_trial_alert',{ p_id:item.id });
    if (claimed.error) throw new Error('Unable to claim queued alert.');
    if (!claimed.data) continue;
    // Recheck subscription at send time, including unsubscribe since collection.
    const current = await db.from('trial_alert_subscriptions').select('*').eq('id',item.subscriber_id).maybeSingle();
    if (current.error) throw new Error('Unable to recheck recipient consent.');
    if (!current.data) continue;
    const sub = current.data as Subscriber;
    const run = await db.from('trial_monitor_runs').select('checked_at,completed_at').eq('id',item.run_id).single();
    if (run.error || !run.data?.completed_at) throw new Error('Alert refers to an unpublished run.');
    if (Date.parse(sub.preferences_at)>Date.parse(run.data.checked_at)) {
      if ((await db.from('trial_alert_outbox').update({state:'cancelled',lease_until:null}).eq('id',item.id)).error) throw new Error('Unable to cancel outdated preferences.');
      continue;
    }
    const stillQueued=await db.from('trial_alert_outbox').select('state').eq('id',item.id).maybeSingle();
    if (stillQueued.error) throw new Error('Unable to recheck alert cancellation.');
    if (stillQueued.data?.state !== 'sending') continue;
    let accepted = false;
    for (let attempt=0;attempt<3;attempt++) {
      try {
        const providerId = await sendEmail(sub.email,'An update to your study watchlist',alertText(sub.preferences.product,sub.id,item.notices as Notice[],run.data.checked_at),'trial-update/'+item.id);
        const saved = await db.from('trial_alert_outbox').update({ state:'sent',sent_at:new Date().toISOString(),provider_id:providerId,lease_until:null }).eq('id',item.id);
        if (saved.error) throw new Error('Unable to record delivery');
        accepted = true; sent++; break;
      } catch { if (attempt < 2) await new Promise(resolve=>setTimeout(resolve,1000*(attempt+1))); }
    }
    if (!accepted) failures++;
    // Respect a conservative provider request rate.
    await new Promise(resolve=>setTimeout(resolve,600));
  }
  console.log(`Email provider accepted ${sent} alerts; ${failures} need retry/review. No emails are sent when there are no changes.`);
  const uncertain=await db.from('trial_alert_outbox').select('id',{count:'exact',head:true}).eq('state','uncertain');
  if (uncertain.error || uncertain.count) throw new Error('Unconfirmed deliveries need operator review in Resend. See docs/trial-alert-setup.md.');
  if (failures) throw new Error('Some sends are unconfirmed. Inspect Resend before retrying after 22 hours; do not reset uncertain messages blindly.');
}
main().catch(error=>{ console.error(error instanceof Error ? error.message : 'Trial monitoring failed.'); process.exitCode=1; });
