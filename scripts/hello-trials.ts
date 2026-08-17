import "dotenv/config";



const URL =
 "https://clinicaltrials.gov/api/v2/studies?query.cond=alzheimer&pageSize=5";

async function main() {
 const res = await fetch(URL);
 if (!res.ok) throw new Error("Request failed: " + res.status);

 const data = await res.json();
 const studies = data.studies ?? [];

 console.log("Trials returned:", studies.length);
 console.log("Anthropic key loaded:", Boolean(process.env.ANTHROPIC_API_KEY));

 for (const s of studies) {
   const id = s.protocolSection?.identificationModule?.nctId;
   const title = s.protocolSection?.identificationModule?.briefTitle;
   const elig =
     s.protocolSection?.eligibilityModule?.eligibilityCriteria ?? "";
   console.log("");
   console.log(id + " " + title);
   console.log("Eligibility text length:", elig.length);
 }
} 


main().catch((e) => {
 console.error(e);
 process.exit(1);
});
