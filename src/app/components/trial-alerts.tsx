'use client';
import { useState } from 'react';
import Link from 'next/link';
import { CONDITIONS, type Preferences, type Product, type Notice } from '@/lib/trial-monitor/model';
import './trial-alerts.css';

type History = { id: string; notices: Notice[]; state: string; sent_at: string | null };
export default function TrialAlerts({ product, enabled, initial, trial = '' }: { product: Product; enabled: boolean; initial?: Partial<Preferences>; trial?: string }) {
  const [preferences,setPreferences] = useState<Preferences>({ product,condition:product==='alz' ? CONDITIONS[0] : 'R-CPD',country:'United States',state:'',ageBand:'',studyPartner:'unknown',localOnly:false,newMatches:!trial,...initial });
  const [email,setEmail] = useState(''), [consent,setConsent] = useState(false);
  const [message,setMessage] = useState(''), [error,setError] = useState(''), [busy,setBusy] = useState(false);
  const [key,setKey] = useState(''), [follows,setFollows] = useState<Record<string,string>>({}), [history,setHistory] = useState<History[]>([]);
  const [remove,setRemove] = useState(false);
  const [followId,setFollowId] = useState(trial);
  function update<K extends keyof Preferences>(name:K,value:Preferences[K]) { setPreferences(p=>({...p,[name]:value})); }
  async function call(body: object, auth = key) {
    const response = await fetch('/api/trial-alerts',{method:'POST',headers:{'Content-Type':'application/json',...(auth ? { Authorization:'Bearer '+auth } : {})},body:JSON.stringify(body)});
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Please try again later.');
    return data;
  }
  async function act(action: string) {
    setBusy(true); setError(''); setMessage('');
    try {
      let activeKey = key;
      if (action === 'open') {
        const fragment = new URLSearchParams(window.location.hash.slice(1));
        const verification = fragment.get('verify');
        if (verification) {
          const data = await call({action:'verify',token:verification});
          activeKey = data.key;
          window.history.replaceState(null,'','#key='+activeKey);
          setMessage(data.message);
        } else activeKey = fragment.get('key') || '';
        if (!activeKey) throw new Error('Use the private link in your email. If you lost it, enter the same email below to request a new link.');
        setKey(activeKey);
        action = 'manage';
      }
      const data = await call({action,preferences,email,consent,trial:followId,website:(document.getElementById('alert-website') as HTMLInputElement | null)?.value || ''},activeKey);
      if (data.preferences) { setPreferences(data.preferences); setFollows(data.follows); setHistory(data.history); }
      if (data.deleted) { setKey('');setFollows({});setHistory([]);setConsent(false);window.history.replaceState(null,'',window.location.pathname); }
      if (data.message) setMessage(data.message);
    } catch (e) { setError(e instanceof Error ? e.message : 'Please try again later.'); }
    finally { setBusy(false); }
  }
  async function unfollow(id:string) {
    setBusy(true);setError('');
    try { const data=await call({action:'unfollow',trial:id});setFollows(data.follows);setMessage('Stopped following '+id+'.'); }
    catch(e) { setError(e instanceof Error ? e.message : 'Please try again.'); } finally {setBusy(false);}
  }
  return <div className="alerts-panel">
    <p className="alerts-intro">Daily checks. An email when there’s something worth checking.</p>
    <p>Follow a study to hear about recruitment, eligibility, location and contact changes. You can also ask for newly recruiting studies that may fit your broad preferences. We send no routine “nothing changed” emails.</p>
    <p>A possible match is a lead to discuss with a study coordinator. It does not establish eligibility. Registry records can lag real availability; alerts arrive after the next successful daily check.</p>
    {!enabled && <p className="alerts-status" role="status">Email alerts are not available yet. The signup will open once email delivery has been connected. You can still browse the trial listings.</p>}
    <p><button className="alerts-secondary" disabled={busy} onClick={()=>act('open')}>Confirm email / open my private alerts link</button></p>
    {message && <p role="status" className="alerts-status">{message}</p>}
    {error && <p role="alert" className="alerts-error">{error}</p>}
    {key && <section><h2>Your followed studies</h2>
      {Object.keys(follows).length ? <ul>{Object.keys(follows).map(id=><li key={id}><a href={'https://clinicaltrials.gov/study/'+id} target="_blank" rel="noreferrer">{id}</a> <button className="alerts-secondary" disabled={busy} onClick={()=>unfollow(id)}>Stop following {id}</button></li>)}</ul> : <p>You are not following any individual studies yet.</p>}
      <label>Follow another study (ClinicalTrials.gov ID)<input value={followId} onChange={e=>setFollowId(e.target.value.trim().toUpperCase())} placeholder="NCT01234567" maxLength={11}/></label>
      <button disabled={busy || !/^NCT\d{8}$/.test(followId)} onClick={()=>act('follow')}>Follow study</button>
    </section>}
    <form onSubmit={e=>{e.preventDefault();void act(key ? 'save' : 'subscribe');}}>
      <fieldset disabled={(!enabled && !key) || busy}><legend>{key ? 'Your alert preferences' : 'Choose your updates'}</legend>
        {!key && <label>Email address<input type="email" autoComplete="email" required maxLength={254} value={email} onChange={e=>setEmail(e.target.value)}/></label>}
        {!key && trial && <p>You’re asking to follow <strong>{trial}</strong>. Its changes will be sent even if it does not match the preferences below.</p>}
        {product==='burp' && <label>Condition to watch<select value={preferences.condition} onChange={e=>update('condition',e.target.value as Preferences['condition'])}>{CONDITIONS.slice(1).map(c=><option key={c}>{c}</option>)}</select></label>}
        <label className="alerts-check"><input type="checkbox" checked={preferences.newMatches} onChange={e=>update('newMatches',e.target.checked)}/> Tell me about newly recruiting potential matches</label>
        <p className="alerts-help">These optional answers filter new-study alerts. They do not filter updates to studies you explicitly follow. If you leave them blank, the search stays broad. Diagnosis, genetics, test results and all other eligibility rules still need checking.</p>
        <div className="alerts-fields">
          <label>Country<input value={preferences.country} maxLength={80} onChange={e=>update('country',e.target.value)} placeholder="For example, United States" autoComplete="country-name"/></label>
          <label>State or region<input value={preferences.state} maxLength={80} onChange={e=>update('state',e.target.value)} placeholder="For example, North Carolina"/></label>
          <label>Age band<select value={preferences.ageBand} onChange={e=>update('ageBand',e.target.value)}><option value="">Not shared</option><option value="under-50">Under 50</option><option value="50-64">50–64</option><option value="65-74">65–74</option><option value="75-84">75–84</option><option value="85-plus">85 and older</option></select></label>
          {product==='alz' && <label>Study partner available?<select value={preferences.studyPartner} onChange={e=>update('studyPartner',e.target.value as Preferences['studyPartner'])}><option value="unknown">Not sure / not shared</option><option value="yes">Yes</option><option value="no">No</option></select></label>}
        </div>
        <label className="alerts-check"><input type="checkbox" checked={preferences.localOnly} onChange={e=>update('localOnly',e.target.checked)}/> Only consider sites in my state or region</label>
        <p className="alerts-help">This compares listed regions, not driving distance. A short drive cannot be estimated from this information.</p>
        {!key && <><label className="alerts-check"><input type="checkbox" checked={consent} required onChange={e=>setConsent(e.target.checked)}/> I agree to receive these study emails and to store my email, selected preferences and follows for this purpose. I can unsubscribe and delete them at any time.</label><label className="alerts-honey" aria-hidden="true">Website<input id="alert-website" tabIndex={-1} autoComplete="off"/></label></>}
        <button type="submit">{busy ? 'Working…' : key ? 'Save preferences' : 'Email me a confirmation link'}</button>
      </fieldset>
    </form>
    {key && <><section><h2>Recent alerts</h2>{history.length ? <ul>{history.map(item=><li key={item.id}><p>{item.sent_at ? 'Sent to email provider '+new Date(item.sent_at).toLocaleDateString() : item.state==='cancelled' ? 'Cancelled after your preferences changed' : item.state==='uncertain' ? 'Delivery needs checking' : 'Awaiting delivery'}</p>{item.notices.map(n=><div key={n.id}><a href={'https://clinicaltrials.gov/study/'+n.id} rel="noreferrer">{n.title}</a><ul>{n.changes.map(c=><li key={c}>{c}</li>)}</ul></div>)}</li>)}</ul> : <p>No alerts yet. We’ll stay quiet until a meaningful change is found.</p>}</section>
      <section><h2>Stop all emails</h2><label className="alerts-check"><input type="checkbox" checked={remove} onChange={e=>setRemove(e.target.checked)}/> Delete this site’s alert subscription, preferences and follows.</label><button className="alerts-secondary" disabled={!remove || busy} onClick={()=>act('delete')}>Unsubscribe and delete alert data</button></section></>}
    <p className="alerts-help">Email is sent through Resend. Your preferences are stored in Supabase; they are not sent to trial coordinators. Email subjects do not name a condition, but message contents can reveal your research interests. Keep management links private. <Link href="/privacy">Read about storage and deletion</Link>.</p>
    <section><h2>Before you contact a study</h2><ul><li>Confirm the site is still enrolling and ask who can take part.</li><li>Ask about visits, tests, risks, placebo groups and whether current treatment changes.</li><li>Ask about travel, accommodation, costs and reimbursement.</li><li>Discuss the study with your own clinician. Participation is voluntary.</li></ul></section>
  </div>;
}
