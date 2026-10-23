import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { validProfileId } from '../profile';
export function hash(value: string) { return createHash('sha256').update(value).digest('hex'); }
function secret() {
  const value = process.env.TRIAL_ALERT_SECRET;
  if (!value || value.length < 32) throw new Error('Trial alert secret is missing.');
  return value;
}
export function privateKey(value: string) { return createHmac('sha256',secret()).update(value).digest('base64url'); }
export function managementKey(id: string) { return `${id}.${privateKey('manage:'+id)}`; }
export function subscriberId(key: string): string | null {
  const [id, signature, extra] = key.split('.');
  if (!validProfileId(id) || extra || !signature) return null;
  const expected = Buffer.from(privateKey('manage:'+id)), actual = Buffer.from(signature);
  return expected.length === actual.length && timingSafeEqual(expected,actual) ? id : null;
}
export function alertOrigin() {
  const origin = new URL(process.env.TRIAL_ALERT_SITE_URL || '');
  if (origin.protocol !== 'https:' && !['localhost','127.0.0.1'].includes(origin.hostname)) throw new Error('Alert site must use HTTPS.');
  return origin.origin;
}
export function alertsConfigured() {
  try { secret(); alertOrigin(); return process.env.TRIAL_ALERTS_ENABLED === 'true' && !!process.env.RESEND_API_KEY && !!process.env.TRIAL_ALERT_FROM; } catch { return false; }
}
