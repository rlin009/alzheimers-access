import type { SupabaseClient } from '@supabase/supabase-js';
import type { MonitorTrial, Snapshot, Subscriber } from './model';

export async function loadSnapshot(db: SupabaseClient): Promise<Snapshot | null> {
  const head = await db.from('trial_monitor_head').select('run_id').eq('singleton', true).maybeSingle();
  // Safe staged rollout: no migration yet means use the explicitly dated old catalog.
  if (head.error?.code === 'PGRST205' || head.error?.code === '42P01') return null;
  if (head.error) throw new Error('Trial update service is unavailable.');
  if (!head.data?.run_id) return null;
  const run = await db.from('trial_monitor_runs').select('id,checked_at,record_count,completed_at').eq('id', head.data.run_id).single();
  if (run.error || !run.data?.completed_at) throw new Error('Trial snapshot is incomplete.');
  const trials: MonitorTrial[] = [];
  for (let offset = 0; offset < run.data.record_count; offset += 500) {
    const result = await db.from('trial_monitor_records').select('payload').eq('run_id', run.data.id).order('nct_id').range(offset, offset+499);
    if (result.error) throw new Error('Trial snapshot could not be loaded.');
    trials.push(...(result.data ?? []).map(row => row.payload as MonitorTrial));
  }
  if (trials.length !== run.data.record_count) throw new Error('Trial snapshot did not reconcile.');
  return { id: run.data.id, checkedAt: run.data.checked_at, trials };
}
export async function loadSubscribers(db: SupabaseClient): Promise<Subscriber[]> {
  const all: Subscriber[] = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await db.from('trial_alert_subscriptions').select('*').order('id').range(offset,offset+499);
    if (error) throw new Error('Unable to load alert subscriptions.');
    all.push(...(data ?? []) as Subscriber[]);
    if (!data || data.length < 500) return all;
  }
}
