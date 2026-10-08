import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

test('alert migration enforces verification, publication, private access and deletion',async()=>{
  const db=new PGlite();
  try {
    await db.exec('create role anon; create role authenticated; create role service_role bypassrls;');
    await db.exec(await readFile('supabase/migrations/202610080001_trial_monitor.sql','utf8'));
    const req='00000000-0000-4000-8000-000000000001',run='00000000-0000-4000-8000-000000000002';
    const scalar=async<T>(sql:string,args:unknown[]=[])=> (await db.query<{value:T}>(sql,args)).rows[0]?.value;
    await db.query("insert into trial_alert_requests(id,email,product,token_hash,preferences,follows) values($1,'person@example.invalid','alz','hash','{\"product\":\"alz\"}','{\"NCT12345678\":\"2020-01-01\"}')",[req]);
    assert.equal(await scalar('select count(*)::int as value from trial_alert_subscriptions'),0);
    assert.equal(await scalar('select confirm_trial_alert($1,$2) as value',[req,'wrong']),null);
    const subscriber=await scalar<string>('select confirm_trial_alert($1,$2) as value',[req,'hash']);assert.ok(subscriber);
    assert.equal(await scalar('select confirm_trial_alert($1,$2) as value',[req,'hash']),null);
    const follow=await scalar<Record<string,string>>('select follows as value from trial_alert_subscriptions where id=$1',[subscriber]);
    assert.ok(Date.parse(follow.NCT12345678)>Date.parse('2020-01-01'));
    assert.equal(await scalar('select trial_alert_rate_limit($1,1,3600) as value',['limited']),true);
    assert.equal(await scalar('select trial_alert_rate_limit($1,1,3600) as value',['limited']),false);
    await db.query('insert into trial_monitor_runs(id,checked_at,record_count) values($1,now(),1)',[run]);
    await assert.rejects(db.query('select publish_trial_monitor($1,null,\'[]\')',[run]),/Incomplete/);
    assert.equal(await scalar('select run_id as value from trial_monitor_head'),null);
    await db.query("insert into trial_monitor_records(run_id,nct_id,payload) values($1,'NCT12345678','{}')",[run]);
    await db.query('select publish_trial_monitor($1,null,$2::jsonb)',[run,JSON.stringify([{subscriber_id:subscriber,notices:[{id:'NCT12345678',changes:['Closed']}]}])]);
    assert.equal(await scalar('select run_id as value from trial_monitor_head'),run);
    await assert.rejects(db.query('select publish_trial_monitor($1,null,\'[]\')',[run]),/Snapshot changed/);
    assert.equal(await scalar('select count(*)::int as value from trial_alert_outbox'),1);
    const outbox=await scalar<string>('select id as value from trial_alert_outbox');
    assert.equal(await scalar('select claim_trial_alert($1) as value',[outbox]),true);
    assert.equal(await scalar('select claim_trial_alert($1) as value',[outbox]),false);
    await db.query("update trial_alert_outbox set first_attempt_at=now()-interval '25 hours',lease_until=now()-interval '1 hour' where id=$1",[outbox]);
    assert.equal(await scalar('select claim_trial_alert($1) as value',[outbox]),false);
    assert.equal(await scalar('select state as value from trial_alert_outbox'),'uncertain');
    await db.query("select follow_trial_alert($1,'NCT12345679')",[subscriber]);
    await db.query("select unfollow_trial_alert($1,'NCT12345678')",[subscriber]);
    assert.equal(await scalar("select follows ? 'NCT12345678' as value from trial_alert_subscriptions"),false);
    await db.exec('set role anon');
    await assert.rejects(db.query('select * from trial_alert_subscriptions'),/permission denied/);
    await assert.rejects(db.query("select trial_alert_rate_limit('x',1,1)"),/permission denied/);
    await db.exec('reset role');
    await db.query('select delete_trial_alert($1)',[subscriber]);
    assert.equal(await scalar('select count(*)::int as value from trial_alert_outbox'),0);
    assert.equal(await scalar('select count(*)::int as value from trial_alert_subscriptions'),0);
  } finally {await db.close();}
});
