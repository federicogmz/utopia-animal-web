/**
 * add-negative-keywords.mjs
 * Agrega keywords negativas a campañas de adopción y vet.
 *
 * Adopción: gratis, gratuito, alcaldía, hogar de alicia, fundación la perla, siamés
 * Vet: gratis, gratuito, alcaldía
 */
import { getAdsConfig, createCustomer } from "./shared.mjs";

const config = getAdsConfig({ requireCustomerId: true });
const customer = createCustomer(config);

// Campaigns
const ADOPTION_CAMPAIGNS = [
  { id: "21662036619", name: "Elim 04/09/2024" },
  { id: "23878365561", name: "Elim - Adopcion" },
  { id: "23888045923", name: "Elim - Hogar Temporal" },
];

const VET_CAMPAIGNS = [
  { id: "23569976773", name: "Utopía Animal Vet 14/02/2026" },
  { id: "23897799250", name: "Vet - Consulta General" },
  { id: "23876666100", name: "Vet - Vacunas" },
  { id: "23878284642", name: "Vet - Cirugia" },
  { id: "23886159316", name: "Vet - Esterilización" },
  { id: "23886212521", name: "Vet - Urgencias" },
  { id: "23888137164", name: "Jornada Esterilización – Junio 2026" },
  { id: "23888160177", name: "Educacion Felina" },
];

// Keywords negativas — match type BROAD para máxima cobertura
const ADOPTION_NEGATIVES = [
  "gratis",
  "gratuito",
  "gratuita",
  "alcaldía",
  "alcaldia",
  "hogar de alicia",
  "fundación la perla",
  "fundacion la perla",
  "siamés",
  "siames",
];

const VET_NEGATIVES = [
  "gratis",
  "gratuito",
  "gratuita",
  "alcaldía",
  "alcaldia",
  "dios",
  "free",
];

async function addNegativesToCampaign(campaignId, campaignName, negatives) {
  console.log(`\n📌 Agregando negativos a: ${campaignName} (${campaignId})`);

  // Check existing negatives to avoid duplicates
  const existing = await customer.query(`
    SELECT campaign_criterion.keyword.text
    FROM campaign_criterion
    WHERE campaign.id = ${campaignId}
      AND campaign_criterion.type = 'KEYWORD'
      AND campaign_criterion.negative = true
  `);

  const existingTexts = new Set(
    existing.map((r) => r.campaign_criterion?.keyword?.text?.toLowerCase() ?? "")
  );

  const toAdd = negatives.filter((kw) => !existingTexts.has(kw.toLowerCase()));

  if (toAdd.length === 0) {
    console.log(`  ✅ Todos los negativos ya existen.`);
    return;
  }

  const operations = toAdd.map((keyword) => ({
    campaign: `customers/${config.customerId}/campaigns/${campaignId}`,
    keyword: {
      text: keyword,
      match_type: "BROAD",
    },
    negative: true,
    type: "KEYWORD",
  }));

  try {
    await customer.campaignCriteria.create(operations);
    console.log(`  ✅ Agregados: ${toAdd.map((k) => `"${k}"`).join(", ")}`);
  } catch (err) {
    console.error(`  ❌ Error:`, err.message);
  }
}

console.log("🚫 Iniciando adición de keywords negativas...\n");

for (const campaign of ADOPTION_CAMPAIGNS) {
  await addNegativesToCampaign(campaign.id, campaign.name, ADOPTION_NEGATIVES);
}

for (const campaign of VET_CAMPAIGNS) {
  await addNegativesToCampaign(campaign.id, campaign.name, VET_NEGATIVES);
}

console.log("\n✅ Keywords negativas completadas.");
