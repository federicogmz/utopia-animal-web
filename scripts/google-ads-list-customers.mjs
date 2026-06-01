import {
  createGoogleAdsClient,
  getAdsConfig,
} from "./google-ads/shared.mjs";

async function main() {
  const config = getAdsConfig();
  const client = createGoogleAdsClient(config);
  const result = await client.listAccessibleCustomers(config.refreshToken);
  const customers = result.resource_names ?? [];

  if (customers.length === 0) {
    console.log("No se encontraron cuentas accesibles para el refresh token actual.");
    return;
  }

  console.log("Cuentas accesibles:");
  for (const resourceName of customers) {
    console.log(`- ${resourceName}`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
