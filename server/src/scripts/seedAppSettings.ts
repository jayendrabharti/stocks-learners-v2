/**
 * Seed script for initializing AppSettings with default exchange rate
 */

import prisma from "../database/client.js";

async function seedAppSettings() {
  console.log("🌱 Seeding AppSettings...");

  // Check if AppSettings already exists
  const existing = await prisma.appSettings.findFirst();

  if (existing) {
    console.log("✅ AppSettings already exists, skipping seed");
    return;
  }

  // Create default AppSettings
  const settings = await prisma.appSettings.create({
    data: {
      exchangeRate: 1.0, // Default: 1 real rupee = 1 dummy rupee
    },
  });

  console.log(
    `✅ Created AppSettings with exchange rate: ${settings.exchangeRate}`
  );
}

async function main() {
  try {
    await seedAppSettings();
    console.log("🎉 Seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error during seeding:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
