import "dotenv/config";

import Anthropic from "@anthropic-ai/sdk";

async function main() {
  const client = new Anthropic();

  for await (const model of client.models.list()) {
    console.log(model.id);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
