import type { Metadata } from 'next';
import TrialAlerts from '@/app/components/trial-alerts';
import { alertsConfigured } from '@/lib/trial-monitor/security';
import { CONDITIONS, type Condition } from '@/lib/trial-monitor/model';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title:'Study email alerts',robots:{index:false,follow:false},referrer:'no-referrer' };
export default async function AlertsPage({searchParams}:{searchParams:Promise<{trial?:string;condition?:string}>}) {
  const params=await searchParams;
  const condition=CONDITIONS.slice(1).includes(params.condition as Condition) ? params.condition as Condition : 'R-CPD';
  return <main id="main" className="ni-main"><div className="ni-wrap ni-page"><header className="ni-page-head"><p className="ni-eyebrow">Study alerts</p><h1 className="ni-page-title">Keep an eye on trials</h1></header><TrialAlerts product="burp" enabled={alertsConfigured()} initial={{condition}} trial={/^NCT\d{8}$/.test(params.trial || '') ? params.trial : ''}/></div></main>;
}
