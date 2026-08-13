import "dotenv/config";

async function main(): Promise<void> {
  const url = "https://clinicaltrials.gov/api/v2/studies?query.cond=alzheimer&pageSize=1";

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error fetching clinical trials data:", error);
    process.exit(1);
  }
}

main();