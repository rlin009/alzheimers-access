import 'server-only';
import { createServerSupabaseClient } from '../supabase/server';
import { TRIALS, type Trial } from '../nameit/data';
import type { Label } from '../nameit/conditions';
import { loadSnapshot } from './store';
export async function getBurpTrials(): Promise<{trials:Trial[];fetched:string;automatic:boolean;unavailable:boolean}> {
  try {
    const snapshot=await loadSnapshot(createServerSupabaseClient());
    if (!snapshot) return {...TRIALS,automatic:false,unavailable:false};
    return { fetched:snapshot.checkedAt.slice(0,10),automatic:true,unavailable:false,trials:snapshot.trials.filter(t=>t.scope==='include' && t.conditions.some(c=>c!=='Alzheimer’s / dementia') && ['RECRUITING','NOT_YET_RECRUITING'].includes(t.status)).map(t=>({
      nctId:t.id,title:t.title,summary:t.summary ? t.summary.slice(0,650)+(t.summary.length>650 ? '…' : '') : 'Read the current eligibility requirements and study description in the registry.',
      conditions:t.conditions.filter(c=>c!=='Alzheimer’s / dementia') as Label[],status:t.status as Trial['status'],studyType:t.studyType as Trial['studyType'],phases:[],enrollment:null,minAge:t.minAge,maxAge:t.maxAge,sponsor:t.sponsor,
      siteCount:t.trial.locations?.length ?? 0,sites:(t.trial.locations ?? []).map(l=>{const site=l as typeof l & {city?:string};return [site.city,site.state,site.country,l.status ? '('+l.status.replaceAll('_',' ').toLowerCase()+')' : '(site recruitment not specified)'].filter(Boolean).join(', ');}),
      countries:[...new Set((t.trial.locations ?? []).map(l=>l.country))],lastUpdate:t.updated ?? '',url:'https://clinicaltrials.gov/study/'+t.id,
    })) };
  } catch {return {...TRIALS,automatic:false,unavailable:true};}
}
