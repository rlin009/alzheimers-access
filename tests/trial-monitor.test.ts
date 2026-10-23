import { test } from 'node:test';
import assert from 'node:assert/strict';
import { meaningfulChanges, noticesFor, potentialMatch, validatePreferences, type MonitorTrial, type Preferences, type Subscriber } from '../src/lib/trial-monitor/model';
import { collectRegistry, normalizeStudy, searchRegistry } from '../src/lib/trial-monitor/registry';
import { managementKey, subscriberId } from '../src/lib/trial-monitor/security';
import { sendEmail } from '../src/lib/trial-monitor/email';
import type { RegistryStudy } from '../src/lib/trial-scope';

const preferences:Preferences={product:'alz',condition:'Alzheimer’s / dementia',country:'United States',state:'NC',ageBand:'65-74',studyPartner:'yes',localOnly:true,newMatches:true};
function study(id='NCT12345678',status='RECRUITING'):RegistryStudy {return {protocolSection:{identificationModule:{nctId:id,briefTitle:'Alzheimer dementia treatment'},statusModule:{overallStatus:status},conditionsModule:{conditions:['Alzheimer disease']},eligibilityModule:{minimumAge:'50 Years',maximumAge:'80 Years',eligibilityCriteria:'Adults with a diagnosis'},contactsLocationsModule:{locations:[{country:'United States',state:'North Carolina',status:'RECRUITING'}]}}};}
function trial():MonitorTrial {return normalizeStudy(study(),['Alzheimer’s / dementia'],'2026-10-08T12:00:00Z');}
const sub:Subscriber={id:'00000000-0000-4000-8000-000000000001',email:'test@example.invalid',preferences,follows:{NCT12345678:'2026-10-01T12:00:00Z'},preferences_at:'2026-10-01T12:00:00Z',created_at:'2026-10-01T12:00:00Z'};
test('matching honors age, site recruitment, region and explicit scope',()=>{
  const t=trial();assert.equal(potentialMatch(t,preferences),true);
  assert.equal(potentialMatch({...t,scope:'review'},preferences),false);
  assert.equal(potentialMatch({...t,status:'NOT_YET_RECRUITING'},preferences),false);
  assert.equal(potentialMatch(t,{...preferences,ageBand:'85-plus'}),false);
  assert.equal(potentialMatch(t,{...preferences,state:'NY'}),false);
  assert.equal(potentialMatch({...t,trial:{...t.trial,locations:[{country:'United States',state:'NC',status:'COMPLETED'}]}},preferences),false);
});
test('first sync and unchanged records produce no alerts; new or opening studies do',()=>{
  const t=trial(),before={id:'a',checkedAt:'2026-10-07T12:00:00Z',trials:[t]},after={id:'b',checkedAt:'2026-10-08T12:00:00Z',trials:[t]};
  assert.deepEqual(noticesFor(sub,null,after),[]);assert.deepEqual(noticesFor(sub,before,after),[]);
  assert.equal(noticesFor(sub,{...before,trials:[]},after).length,1);
  assert.equal(noticesFor(sub,{...before,trials:[{...t,status:'NOT_YET_RECRUITING'}]},after)[0].changes.length,2);
});
test('followed closure is reported even when age/location preferences rule the study out',()=>{
  const t=trial(),after={id:'b',checkedAt:'2026-10-08T12:00:00Z',trials:[{...t,status:'COMPLETED'}]};
  const notices=noticesFor({...sub,preferences:{...preferences,ageBand:'85-plus',newMatches:false}},{id:'a',checkedAt:'2026-10-07T12:00:00Z',trials:[t]},after);
  assert.match(notices[0].changes[0],/Completed/);
  assert.deepEqual(noticesFor(sub,{id:'a',checkedAt:'2026-10-07T12:00:00Z',trials:[t]},{...after,trials:[]}),[]);
});
test('no retroactive changes before a person follows or changes preferences',()=>{
  const t=trial();const recent={...sub,follows:{[t.id]:'2026-10-08T13:00:00Z'},preferences_at:'2026-10-08T13:00:00Z'};
  assert.deepEqual(noticesFor(recent,{id:'a',checkedAt:'2026-10-07T12:00:00Z',trials:[t]},{id:'b',checkedAt:'2026-10-08T14:00:00Z',trials:[{...t,status:'COMPLETED'}]}),[]);
});
test('date-only and reordered sites do not generate an email; eligibility edits do',()=>{
  const t=trial();assert.deepEqual(meaningfulChanges(t,{...t,updated:'2026-10-09'}),[]);
  const locs=[{country:'United States',state:'NC'},{country:'United States',state:'NY'}];
  assert.deepEqual(meaningfulChanges({...t,trial:{...t.trial,locations:locs}},{...t,trial:{...t.trial,locations:[...locs].reverse()}}),[]);
  assert.equal(meaningfulChanges(t,{...t,trial:{...t.trial,eligibility_text:'Different criteria'}}).length,1);
});
test('pagination retrieves every page and rejects unreconciled or repeated records',async()=>{
  let count=0;
  const fetcher=(async()=>Response.json(++count===1 ? {studies:[study()],totalCount:2,nextPageToken:'next'} : {studies:[study('NCT12345679')],totalCount:2})) as typeof fetch;
  assert.equal((await searchRegistry('R-CPD','query',fetcher)).length,2);
  await assert.rejects(searchRegistry('R-CPD','query',(async()=>Response.json({studies:[study()],totalCount:2})) as typeof fetch),/reconcile/);
  await assert.rejects(searchRegistry('R-CPD','query',(async()=>Response.json({studies:[study()],totalCount:2,nextPageToken:'same'})) as typeof fetch),/duplicate/);
});
test('a missing active study is fetched directly and its actual status retained',async()=>{
  const old=trial();let direct=0;
  const fetcher=(async(url)=>{if(String(url).endsWith('/'+old.id)){direct++;return Response.json(study(old.id,'COMPLETED'));}return Response.json({studies:[],totalCount:0});}) as typeof fetch;
  const found=await collectRegistry([old],[],'2026-10-09T12:00:00Z',fetcher);
  assert.equal(direct,1);assert.equal(found[0].status,'COMPLETED');
});
test('eligibility amendments invalidate old extracted criteria',()=>{
  const old=trial();old.trial.criteria={nct_id:old.id,requires_study_partner:'required',requires_imaging:'not required',requires_lumbar_puncture:'not required'};
  const changed=study();changed.protocolSection.eligibilityModule!.eligibilityCriteria='Updated';
  assert.equal(normalizeStudy(changed,['Alzheimer’s / dementia'],'2026-10-09',old).trial.criteria,null);
  assert.deepEqual(normalizeStudy(study(),['Alzheimer’s / dementia'],'2026-10-09',old).trial.criteria,old.trial.criteria);
});
test('preferences validate product, finite age choices and local-only location',()=>{
  assert.ok(validatePreferences(preferences));assert.equal(validatePreferences({...preferences,condition:'R-CPD'}),null);
  assert.equal(validatePreferences({...preferences,state:''}),null);assert.equal(validatePreferences({...preferences,ageBand:'__proto__'}),null);
});
test('private management keys cannot be forged for another subscriber',()=>{
  process.env.TRIAL_ALERT_SECRET='test-only-secret-with-at-least-32-characters';
  const key=managementKey(sub.id);assert.equal(subscriberId(key),sub.id);assert.equal(subscriberId(key.replace('000000000001','000000000002')),null);assert.equal(subscriberId(key+'x'),null);
});
test('email stays disabled without opt-in configuration and uses provider deduplication',async()=>{
  const saved={...process.env};delete process.env.TRIAL_ALERTS_ENABLED;let calls=0;
  const fetcher=(async(_url,options)=>{calls++;assert.equal((options?.headers as Record<string,string>)['Idempotency-Key'],'event/test');return Response.json({id:'mail-test'});}) as typeof fetch;
  try {await assert.rejects(sendEmail('test@example.invalid','Test','Body','event/test',fetcher),/disabled/);assert.equal(calls,0);
    process.env.TRIAL_ALERTS_ENABLED='true';process.env.RESEND_API_KEY='test';process.env.TRIAL_ALERT_FROM='test@example.invalid';
    assert.equal(await sendEmail('test@example.invalid','Test','Body','event/test',fetcher),'mail-test');
  } finally {for(const name of ['TRIAL_ALERTS_ENABLED','RESEND_API_KEY','TRIAL_ALERT_FROM']) {if(saved[name]===undefined)delete process.env[name];else process.env[name]=saved[name];}}
});
