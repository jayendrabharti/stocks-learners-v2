import dotenv from "dotenv";
dotenv.config();
/**
 * Manual Instrument Seeding Script
 * Run this to seed instruments manually: npm run seed:instruments
 */

import { seedInstruments } from "@/utils/instruments";

async function main() {
  console.log("Starting manual instrument seeding...\n");

  const result = await seedInstruments();

  console.log("\n=== Seeding Summary ===");
  console.log(`Success: ${result.success}`);
  console.log(`Message: ${result.message}`);
  console.log(`CSV Count: ${result.csvCount}`);
  console.log(`DB Count Before: ${result.dbCountBefore}`);
  console.log(`DB Count After: ${result.dbCountAfter}`);
  console.log(`Inserted: ${result.inserted}`);

  process.exit(result.success ? 0 : 1);
}

main();
