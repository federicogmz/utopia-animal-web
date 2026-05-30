/**
 * Crea la campaña Google Ads "Jornada Esterilización – Junio 2026"
 * y su adgroup + keywords + anuncios. Campaña temporal con end date.
 *
 * Uso: node scripts/google-ads-jornada-esterilizacion.mjs
 */
import { createCustomer, getAdsConfig } from './google-ads/shared.mjs';

const LANDING_URL = 'https://refugioanimal.fundsumate.org/jornada-esterilizacion/';

async function run() {
  const config = getAdsConfig({ requireCustomerId: true });
  const customer = createCustomer(config);
  const customerId = `customers/${config.customerId}`;

  console.log('🚀 Creando campaña Jornada Esterilización Junio 2026...\n');

  // ── 1. Campaign Budget ────────────────────────────────────────────────────────
  console.log('▶ 1. Creando presupuesto...');
  const budgetResult = await customer.campaignBudgets.create([{
    name: 'Budget Jornada Esterilización Junio 2026',
    amount_micros: 80000000,
    delivery_method: 2, // STANDARD
    explicitly_shared: false,
  }], { response_content_type: 2 });
  const budgetRN = budgetResult.results[0].resource_name;
  console.log(`   ✅ Budget: ${budgetRN}`);

  // ── 2. Campaña ────────────────────────────────────────────────────────────────
  console.log('▶ 2. Creando campaña...');
  const campaignResult = await customer.campaigns.create([{
    name: 'Jornada Esterilización – Junio 2026',
    advertising_channel_type: 2, // SEARCH
    status: 2, // ENABLED
    start_date: '20260601',
    end_date: '20260630',
    campaign_budget: budgetRN,
    network_settings: {
      target_google_search: true,
      target_search_network: false,  // Ad Grants: search partners no permitidos
      target_content_network: false,
    },
    target_spend: { cpc_bid_ceiling_micros: 2000000 }, // TARGET_SPEND, max $2 USD CPC
    contains_eu_political_advertising: 3, // NOT_EU_POLITICAL_AD
  }], { response_content_type: 2 });
  const campaignRN = campaignResult.results[0].resource_name;
  const campaignId = campaignRN.split('/').pop();
  console.log(`   ✅ Campaña: ${campaignRN}`);

  // ── 3. Ad Group ───────────────────────────────────────────────────────────────
  console.log('▶ 3. Creando ad group...');
  const adGroupResult = await customer.adGroups.create([{
    campaign: campaignRN,
    name: 'Jornada Esterilización General',
    status: 2, // ENABLED
    type: 2, // SEARCH_STANDARD
    cpc_bid_micros: 2000000, // $2 USD – límite Ad Grants
  }], { response_content_type: 2 });
  const adGroupRN = adGroupResult.results[0].resource_name;
  console.log(`   ✅ Ad Group: ${adGroupRN}`);

  // ── 4. Keywords ───────────────────────────────────────────────────────────────
  console.log('▶ 4. Añadiendo keywords...');
  const keywords = [
    // EXACT
    { text: 'jornada esterilización medellín', match: 4 },
    { text: 'jornada de esterilización gatos medellín', match: 4 },
    { text: 'jornada esterilización perros medellín', match: 4 },
    { text: 'esterilización bajo costo medellín', match: 4 },
    { text: 'castración bajo costo medellín', match: 4 },
    // PHRASE
    { text: 'jornada esterilización', match: 3 },
    { text: 'esterilizar gato económico medellín', match: 3 },
    { text: 'castrar perro bajo costo medellín', match: 3 },
    { text: 'esterilización barata medellín', match: 3 },
    { text: 'jornada veterinaria medellín', match: 3 },
    { text: 'esterilización perros gatos medellín', match: 3 },
    { text: 'veterinaria esterilización guayabal', match: 3 },
    { text: 'esterilizar mascota precio medellín', match: 3 },
  ];

  try {
    const resp = await customer.adGroupCriteria.create(
      keywords.map(kw => ({
        ad_group: adGroupRN,
        status: 2, // ENABLED
        keyword: { text: kw.text, match_type: kw.match },
      })),
      { partial_failure: true }
    );
    const failed = resp.partial_failure_error?.details?.length || 0;
    console.log(`   ✅ ${keywords.length - failed}/${keywords.length} keywords añadidas`);
  } catch (err) {
    console.error('   ❌', err.message);
  }

  // ── 5. Negativas de campaña ───────────────────────────────────────────────────
  console.log('▶ 5. Añadiendo negativas...');
  const negatives = [
    'gratis', 'free', 'adopción', 'adoptar', 'rescate', 'donar', 'donación',
    'voluntario', 'bogotá', 'cali', 'barranquilla',
  ];
  try {
    const resp = await customer.campaignCriteria.create(
      negatives.map(text => ({
        campaign: campaignRN,
        negative: true,
        keyword: { text, match_type: 3 }, // PHRASE
      })),
      { partial_failure: true }
    );
    const failed = resp.partial_failure_error?.details?.length || 0;
    console.log(`   ✅ ${negatives.length - failed}/${negatives.length} negativas añadidas`);
  } catch (err) {
    console.error('   ❌', err.message);
  }

  // ── 6. Anuncio RSA ────────────────────────────────────────────────────────────
  console.log('▶ 6. Creando anuncio RSA...');
  try {
    await customer.adGroupAds.create([{
      ad_group: adGroupRN,
      status: 2, // ENABLED
      ad: {
        final_urls: [LANDING_URL],
        responsive_search_ad: {
          headlines: [
            { text: 'Esteriliza Mascota Desde $80k', pinned_field: 2 }, // HEADLINE_1=2
            { text: 'Esterilizacion Medellin' },
            { text: 'Cirugia Anestesia Incluidos' },
            { text: '27-28 Junio Guayabal' },
            { text: 'Cupos Limitados - Agenda Ya' },
            { text: 'Esterilizacion Bajo Costo' },
            { text: 'Gatos $80k Perros Desde $120k' },
            { text: 'Utopia Animal Vet Guayabal' },
            { text: 'Previene Enfermedades Graves' },
          ],
          descriptions: [
            { text: 'Gatos desde $80k. Perros desde $120k. Cirugia, anestesia y medicamentos incluidos.' },
            { text: 'Cupos limitados 27-28 junio. Agenda ya por WhatsApp. Cra 52 No.2 sur-60, Guayabal.' },
          ],
        },
      },
    }]);
    console.log(`   ✅ RSA creado`);
  } catch (err) {
    console.error('   ❌', JSON.stringify(err.errors || err.message));
  }

  // ── 7. Sitelink asset ─────────────────────────────────────────────────────────
  console.log('▶ 7. Creando sitelink...');
  try {
    const sitelinkResult = await customer.assets.create([{
      name: 'Jornada Junio – Precios',
      final_urls: [LANDING_URL],
      sitelink_asset: {
        link_text: 'Ver precios jornada',
        description1: 'Gatos desde $80k · Perros desde $120k',
        description2: '27 y 28 junio · Guayabal · Cupos limitados',
      },
    }], { response_content_type: 2 });
    const sitelinkRN = sitelinkResult.results[0].resource_name;

    await customer.campaignAssets.create([{
      campaign: campaignRN,
      asset: sitelinkRN,
      field_type: 13, // SITELINK
    }], { partial_failure: true });
    console.log(`   ✅ Sitelink vinculado`);
  } catch (err) {
    console.error('   ❌', err.message);
  }

  // ── 8. Call extension ─────────────────────────────────────────────────────────
  console.log('▶ 8. Creando call extension...');
  try {
    const callResult = await customer.assets.create([{
      name: 'Llamada Jornada Esterilización',
      call_asset: {
        country_code: 'CO',
        phone_number: '3215308188',
        call_conversion_reporting_state: 2,
      },
    }], { response_content_type: 2 });
    const callRN = callResult.results[0].resource_name;

    await customer.campaignAssets.create([{
      campaign: campaignRN,
      asset: callRN,
      field_type: 16, // CALL
    }], { partial_failure: true });
    console.log(`   ✅ Call extension vinculada`);
  } catch (err) {
    console.error('   ❌', err.message);
  }

  console.log('\n🎉 Campaña Jornada Esterilización creada exitosamente');
  console.log(`   Campaign resource: ${campaignRN}`);
  console.log(`   Campaign ID: ${campaignId}`);
  console.log(`   Landing URL: ${LANDING_URL}`);
  console.log('\n⚠️  Verifica en Google Ads UI y ajusta presupuesto según límites del Ad Grant');
}

run().catch(err => {
  console.error('Error:', err.errors || err.message || err);
  process.exit(1);
});

