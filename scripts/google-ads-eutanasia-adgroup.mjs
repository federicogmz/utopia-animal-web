/**
 * Crea DOS Ad Groups de eutanasia dentro de la campaña existente
 * "Utopía Animal Vet 14/02/2026" (budget $500/día):
 *   1. Eutanasia – Perros (landing: eutanasia-perros/)
 *   2. Eutanasia – Gatos  (landing: eutanasia-gatos/)
 *
 * Keywords segmentadas por especie para máximo Quality Score.
 *
 * Uso: node scripts/google-ads-eutanasia-adgroup.mjs
 */
import { createCustomer, getAdsConfig } from './google-ads/shared.mjs';

const LANDING_PERROS = 'https://refugioanimal.fundsumate.org/eutanasia-perros/';
const LANDING_GATOS = 'https://refugioanimal.fundsumate.org/eutanasia-gatos/';
const CAMPAIGN_NAME = 'Utopía Animal Vet';

async function run() {
  const config = getAdsConfig({ requireCustomerId: true });
  const customer = createCustomer(config);

  console.log('🔍 Buscando campaña existente...\n');

  // ── 1. Find existing campaign ─────────────────────────────────────────────────
  const campaignRows = await customer.query(`
    SELECT campaign.id, campaign.name, campaign.resource_name, campaign.status
    FROM campaign
    WHERE campaign.name = "${CAMPAIGN_NAME}"
  `);

  if (campaignRows.length === 0) {
    const allCampaigns = await customer.query(`
      SELECT campaign.id, campaign.name, campaign.resource_name
      FROM campaign
      WHERE campaign.status != "REMOVED"
    `);
    console.log('❌ Campaña exacta no encontrada. Campañas activas:');
    for (const row of allCampaigns) {
      console.log(`   - ${row.campaign.name} (ID: ${row.campaign.id})`);
    }
    throw new Error(`Campaña "${CAMPAIGN_NAME}" no encontrada.`);
  }

  const campaign = campaignRows[0];
  const campaignRN = campaign.campaign.resource_name;
  const campaignId = campaign.campaign.id;
  console.log(`✅ Campaña: ${campaign.campaign.name} (ID: ${campaignId})`);
  console.log(`   Resource: ${campaignRN}\n`);

  // ── 2. Add campaign negatives (shared across both ad groups) ─────────────────
  console.log('▶ Añadiendo keywords negativas de campaña...');
  const negatives = [
    'gratis', 'free', 'adopción', 'adoptar', 'voluntario',
    'bogotá', 'cali', 'barranquilla', 'cartagena',
    'empleo', 'trabajo', 'curso', 'carrera',
    'veneno', 'envenenar', 'matar',
  ];
  try {
    const resp = await customer.campaignCriteria.create(
      negatives.map(text => ({
        campaign: campaignRN,
        negative: true,
        keyword: { text, match_type: 3 },
      })),
      { partial_failure: true }
    );
    const failed = resp.partial_failure_error?.details?.length || 0;
    console.log(`   ✅ ${negatives.length - failed}/${negatives.length} negativas\n`);
  } catch (err) {
    console.error('   ❌', err.message);
  }

  // ── 3. AD GROUP 1: Perros ────────────────────────────────────────────────────
  const perrosResult = await createAdGroup({
    customer,
    campaignRN,
    name: 'Eutanasia – Perros',
    landingUrl: LANDING_PERROS,
    keywords: [
      { text: 'eutanasia para perros medellin', match: 4 },
      { text: 'eutanasia perros medellin', match: 4 },
      { text: 'eutanasia a domicilio perros medellin', match: 4 },
      { text: 'dormir a mi perro medellin', match: 4 },
      { text: 'eutanasia perros', match: 3 },
      { text: 'cuando dormir a mi perro', match: 3 },
      { text: 'cuando sacrificar a mi perro', match: 3 },
      { text: 'calidad de vida perro', match: 3 },
      { text: 'cuidados paliativos perros medellin', match: 3 },
      { text: 'mi perro ya no se levanta', match: 3 },
      { text: 'mi perro esta muy enfermo', match: 3 },
      { text: 'perro anciano no quiere comer', match: 3 },
      { text: 'despedida digna mascota', match: 3 },
      { text: 'cremacion mascotas medellin', match: 3 },
      { text: 'veterinaria eutanasia medellin', match: 3 },
    ],
    headlines: [
      { text: 'Eutanasia Digna Para Perros', pinned_field: 2 },
      { text: 'Acompañamiento en Medellín' },
      { text: 'Valoración Calidad de Vida' },
      { text: 'Te Orientamos Sin Presión' },
      { text: 'Procedimiento Sin Dolor' },
      { text: 'Utopía Animal Vet Guayabal' },
      { text: 'A Domicilio o en Clínica' },
      { text: 'Cremación Disponible' },
      { text: 'Habla con un Veterinario' },
    ],
    descriptions: [
      { text: 'Si tu perro sufre, evaluamos su calidad de vida sin compromiso. Procedimiento compasivo en Medellín.' },
      { text: 'Valoración sin costo. Te acompañamos en cada paso. A domicilio o en clínica. Escríbenos por WhatsApp.' },
    ],
  });

  // ── 4. AD GROUP 2: Gatos ─────────────────────────────────────────────────────
  const gatosResult = await createAdGroup({
    customer,
    campaignRN,
    name: 'Eutanasia – Gatos',
    landingUrl: LANDING_GATOS,
    keywords: [
      { text: 'eutanasia gatos medellin', match: 4 },
      { text: 'eutanasia para gatos medellin', match: 4 },
      { text: 'eutanasia a domicilio gatos medellin', match: 4 },
      { text: 'dormir a mi gato medellin', match: 4 },
      { text: 'eutanasia gatos', match: 3 },
      { text: 'cuando dormir a mi gato', match: 3 },
      { text: 'calidad de vida gato', match: 3 },
      { text: 'cuidados paliativos gatos medellin', match: 3 },
      { text: 'mi gato no come y esta triste', match: 3 },
      { text: 'mi gato ya no se levanta', match: 3 },
      { text: 'gato anciano no quiere comer', match: 3 },
      { text: 'gato con cancer etapa final', match: 3 },
      { text: 'gato enfermedad renal terminal', match: 3 },
      { text: 'despedida digna gato', match: 3 },
      { text: 'cremacion gatos medellin', match: 3 },
    ],
    headlines: [
      { text: 'Eutanasia Digna Para Gatos', pinned_field: 2 },
      { text: 'Acompañamiento en Medellín' },
      { text: 'Valoración Calidad de Vida' },
      { text: 'Te Orientamos Sin Presión' },
      { text: 'Procedimiento Sin Estrés' },
      { text: 'Utopía Animal Vet Guayabal' },
      { text: 'A Domicilio o en Clínica' },
      { text: 'Cremación Disponible' },
      { text: 'Habla con un Veterinario' },
    ],
    descriptions: [
      { text: 'Si tu gato sufre y ya no es el mismo, evaluamos su calidad de vida. Procedimiento compasivo en Medellín.' },
      { text: 'Valoración sin costo. Te acompañamos en cada paso. A domicilio o en clínica. Escríbenos por WhatsApp.' },
    ],
  });

  // ── 5. Verify both ad groups were created ────────────────────────────────────
  console.log('▶ Verificando ad groups creados...');
  try {
    const verifyRows = await customer.query(`
      SELECT ad_group.id, ad_group.name, ad_group.status
      FROM ad_group
      WHERE ad_group.name IN ("Eutanasia – Perros", "Eutanasia – Gatos")
        AND campaign.id = ${campaignId}
        AND ad_group.status = "ENABLED"
    `);
    console.log(`   ✅ ${verifyRows.length}/2 ad groups confirmados ENABLED:`);
    for (const row of verifyRows) {
      console.log(`      - ${row.ad_group.name} (ID: ${row.ad_group.id})`);
    }
  } catch (err) {
    console.log('   ⚠️  No se pudo verificar (posible retraso de API). Revisa manualmente.');
  }

  console.log('\n🎉 Ad Groups de Eutanasia creados exitosamente');
  console.log(`   Campaign: ${campaignRN}`);
  console.log(`   Landing Perros: ${LANDING_PERROS}`);
  console.log(`   Landing Gatos: ${LANDING_GATOS}`);
  console.log('\n⚠️  Verifica en Google Ads UI:');
  console.log('   1. Anuncios aprobados en ambos ad groups');
  console.log('   2. Quality Score de keywords');
  console.log('   3. Ajusta bids si necesario (máx $2 CPC por Ad Grants)');
}

async function createAdGroup({ customer, campaignRN, name, landingUrl, keywords, headlines, descriptions }) {
  console.log(`▶ Creando ad group "${name}"...`);

  // Create ad group
  const adGroupResult = await customer.adGroups.create([{
    campaign: campaignRN,
    name,
    status: 2, // ENABLED
    type: 2, // SEARCH_STANDARD
    cpc_bid_micros: 2000000,
  }], { response_content_type: 2 });
  const adGroupRN = adGroupResult.results[0].resource_name;
  console.log(`   ✅ Ad Group: ${adGroupRN}`);

  // Add keywords
  console.log(`   ▶ Añadiendo ${keywords.length} keywords...`);
  try {
    const kwResp = await customer.adGroupCriteria.create(
      keywords.map(kw => ({
        ad_group: adGroupRN,
        status: 2,
        keyword: { text: kw.text, match_type: kw.match },
      })),
      { partial_failure: true }
    );
    const failed = kwResp.partial_failure_error?.details?.length || 0;
    console.log(`   ✅ ${keywords.length - failed}/${keywords.length} keywords`);
  } catch (err) {
    console.error(`   ❌ Keywords error:`, err.message);
  }

  // Create RSA ad
  console.log(`   ▶ Creando RSA...`);
  try {
    await customer.adGroupAds.create([{
      ad_group: adGroupRN,
      status: 2,
      ad: {
        final_urls: [landingUrl],
        responsive_search_ad: { headlines, descriptions },
      },
    }]);
    console.log(`   ✅ RSA creado\n`);
  } catch (err) {
    console.error(`   ❌ RSA error:`, err.errors ? JSON.stringify(err.errors) : err.message);
  }

  return { adGroupRN, landingUrl };
}

run().catch(err => {
  console.error('Error:', err.errors || err.message || err);
  process.exit(1);
});
