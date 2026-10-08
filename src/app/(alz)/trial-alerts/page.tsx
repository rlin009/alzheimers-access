import type { Metadata } from 'next';
import TrialAlerts from '@/app/components/trial-alerts';
import PageHeading from '@/app/components/page-heading';
import { alertsConfigured } from '@/lib/trial-monitor/security';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { validProfileId } from '@/lib/profile';
import type { Preferences } from '@/lib/trial-monitor/model';
import { extractState } from '@/lib/family-profile';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title:'Trial email alerts',robots:{index:false,follow:false},referrer:'no-referrer' };
export default async function AlertsPage({searchParams}:{searchParams:Promise<{profile?:string;trial?:string}>}) {
  const params=await searchParams;
  let initial: Partial<Preferences> = {};
  if (validProfileId(params.profile)) {
    const {data}=await createServerSupabaseClient().from('profiles').select('age_band,location,study_partner,willing_to_travel').eq('id',params.profile).maybeSingle();
    if(data) initial={ageBand:data.age_band || '',state:extractState(data.location) || '',studyPartner:['yes','no'].includes(data.study_partner) ? data.study_partner : 'unknown',localOnly:data.willing_to_travel==='local-only' && !!extractState(data.location)};
  }
  return <main id="main-content" className="page-shell"><PageHeading title="Keep an eye on trials"/><TrialAlerts product="alz" enabled={alertsConfigured()} initial={initial} trial={/^NCT\d{8}$/.test(params.trial || '') ? params.trial : ''}/></main>;
}
