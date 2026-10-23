export default function TrialFreshness({checkedAt,automatic,unavailable=false}:{checkedAt:string;automatic:boolean;unavailable?:boolean}) {
  // This server-only component is rendered per request on dynamic pages.
  // eslint-disable-next-line react-hooks/purity
  const stale=Date.now()-new Date(checkedAt).getTime()>48*60*60*1000;
  return <aside style={{padding:'16px 20px',border:'1px solid #c9d2d6',borderRadius:12,margin:'20px 0',fontSize:16,lineHeight:1.6}} aria-label="Trial listing freshness">
    <strong>{automatic ? 'Last complete registry check' : 'Saved catalog checked'}: {checkedAt.slice(0,10)}</strong>
    <p style={{margin:'6px 0 0'}}>{unavailable ? 'The update service is unavailable. This is the older saved catalog. ' : !automatic ? 'Daily updates have not been connected yet. ' : stale ? 'The daily check is overdue. These listings may be out of date. ' : 'Daily registry checks are scheduled. ' }ClinicalTrials.gov records can lag real availability. Confirm enrollment with the study team.</p>
  </aside>;
}
