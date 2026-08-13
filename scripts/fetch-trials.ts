import "dotenv/config";

async function main(): Promise<void> {
  const url = "https://clinicaltrials.gov/api/v2/studies?query.cond=alzheimer&pageSize=1";

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const studies = data.studies ?? [];

    for (const study of studies) {
      const identification = study.protocolSection?.identificationModule ?? {};
      const status = study.protocolSection?.statusModule ?? {};
      const eligibility = study.protocolSection?.eligibilityModule ?? {};

      const nctId = identification.nctId ?? "N/A";
      const briefTitle = identification.briefTitle ?? "N/A";
      const overallStatus = status.overallStatus ?? "N/A";
      const eligibilityCriteriaLength = (eligibility.eligibilityCriteria ?? "").length;

      console.log(`NCT ID: ${nctId}`);
      console.log(`Brief Title: ${briefTitle}`);
      console.log(`Overall Status: ${overallStatus}`);
      console.log(`Eligibility Criteria Length: ${eligibilityCriteriaLength}`);
      console.log("---");
    }
  } catch (error) {
    console.error("Error fetching clinical trials data:", error);
    process.exit(1);
  }
}

main();