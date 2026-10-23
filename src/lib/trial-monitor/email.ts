import { alertOrigin, managementKey } from './security';
import type { Notice, Product } from './model';
export function alertPath(product: Product) { return product === 'burp' ? '/free-the-burp/alerts' : '/trial-alerts'; }
export function confirmationText(product: Product, id: string, token: string) {
  return `Someone requested study updates using this email address. Confirm only if you requested them.\n\n${alertOrigin()}${alertPath(product)}#verify=${id}.${token}\n\nThis link expires in 24 hours. If this was not you, ignore this email; no subscription will be activated.\n\nQuestions: riteesha.lingechetty@gmail.com`;
}
export function alertText(product: Product, subscriber: string, notices: Notice[], checkedAt: string) {
  return `There are changes to study listings you asked us to watch. Registry checked ${checkedAt.slice(0,10)}.\n\n${notices.map(n => `${n.title} (${n.id})\n${n.changes.join('\n')}\nhttps://clinicaltrials.gov/study/${n.id}`).join('\n\n')}\n\nA possible match is not confirmation of eligibility or a recommendation. Ask the study team about requirements, risks, costs and travel. Registry updates may lag real availability.\n\nManage follows, change preferences, or unsubscribe and delete your alert data:\n${alertOrigin()}${alertPath(product)}#key=${managementKey(subscriber)}\n\nKeep that private link to yourself. Questions: riteesha.lingechetty@gmail.com`;
}
export async function sendEmail(to: string, subject: string, text: string, key: string, fetcher: typeof fetch = fetch): Promise<string> {
  if (process.env.TRIAL_ALERTS_ENABLED !== 'true' || !process.env.RESEND_API_KEY || !process.env.TRIAL_ALERT_FROM) throw new Error('Email delivery is disabled.');
  const res = await fetcher('https://api.resend.com/emails', {
    method: 'POST', signal: AbortSignal.timeout(15000),
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': key },
    body: JSON.stringify({ from: process.env.TRIAL_ALERT_FROM, to: [to], reply_to: 'riteesha.lingechetty@gmail.com', subject, text }),
  });
  if (!res.ok) throw new Error(`Email provider rejected request (${res.status}).`);
  const data = await res.json() as { id?: string };
  if (!data.id) throw new Error('Email provider did not confirm acceptance.');
  return data.id;
}
