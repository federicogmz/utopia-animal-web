/**
 * fix-vet-consulta-url.mjs
 * Actualiza la final_url de todos los anuncios en "Vet - Consulta General"
 * de /veterinaria/ → /veterinaria-medellin-utopia-animal/
 */
import { getAdsConfig, createCustomer } from "./shared.mjs";

const VET_CONSULTA_CAMPAIGN_ID = "23897799250";
const OLD_PATH = "/veterinaria/";
const NEW_URL = "https://refugioanimal.fundsumate.org/veterinaria-medellin-utopia-animal/";

const config = getAdsConfig({ requireCustomerId: true });
const customer = createCustomer(config);

console.log("🔍 Buscando anuncios en Vet - Consulta General...");

const ads = await customer.query(`
  SELECT
    ad_group_ad.ad.id,
    ad_group_ad.ad.final_urls,
    ad_group_ad.ad.type,
    ad_group_ad.status,
    ad_group.id,
    ad_group.name
  FROM ad_group_ad
  WHERE campaign.id = ${VET_CONSULTA_CAMPAIGN_ID}
    AND ad_group_ad.status != 'REMOVED'
`);

if (ads.length === 0) {
  console.log("⚠️  No se encontraron anuncios activos en esta campaña.");
  process.exit(0);
}

console.log(`\nEncontrados ${ads.length} anuncio(s):\n`);

for (const row of ads) {
  const adId = row.ad_group_ad?.ad?.id;
  const adGroupId = row.ad_group?.id;
  const finalUrls = row.ad_group_ad?.ad?.final_urls ?? [];
  const status = row.ad_group_ad?.status;

  console.log(`  Ad ID: ${adId} | AdGroup: ${row.ad_group?.name} | Status: ${status}`);
  console.log(`  URLs actuales: ${JSON.stringify(finalUrls)}`);

  const needsFix = finalUrls.some((u) => u.includes(OLD_PATH));

  if (!needsFix) {
    console.log(`  ✅ URL ya correcta, sin cambios.\n`);
    continue;
  }

  const newUrls = finalUrls.map((u) =>
    u.includes(OLD_PATH) ? NEW_URL : u
  );

  try {
    // google-ads-api: update ad via adGroupAds service using resource_name
    // The update_mask is inferred automatically from the fields provided
    const resourceName = `customers/${config.customerId}/adGroupAds/${adGroupId}~${adId}`;
    console.log(`  Intentando actualizar: ${resourceName}`);

    const result = await customer.adGroupAds.update([
      {
        resource_name: resourceName,
        ad: {
          final_urls: newUrls,
        },
      },
    ]);
    console.log(`  ✅ URL actualizada → ${NEW_URL}`);
    console.log(`  Resultado:`, JSON.stringify(result).slice(0, 200), "\n");
  } catch (err) {
    const detail = err?.errors ?? err?.message ?? JSON.stringify(err);
    console.error(`  ❌ Error al actualizar Ad ${adId}:`, detail);
    // Try alternative: update via ads service directly
    try {
      const result2 = await customer.ads.update([
        {
          resource_name: `customers/${config.customerId}/ads/${adId}`,
          final_urls: newUrls,
        },
      ]);
      console.log(`  ✅ URL actualizada (método ads) → ${NEW_URL}`);
      console.log(`  Resultado:`, JSON.stringify(result2).slice(0, 200), "\n");
    } catch (err2) {
      const detail2 = err2?.errors ?? err2?.message ?? JSON.stringify(err2);
      console.error(`  ❌ Error método ads:`, detail2);
    }
  }
}

console.log("✅ Fix Vet - Consulta General completado.");
