/**
 * Crea la campaña Google Ads "Jornada Esterilización – Junio 2026"
 * y su adgroup + keywords + anuncios. Campaña temporal con end date.
 *
 * Uso: node scripts/google-ads-jornada-esterilizacion.mjs
 */
import { GoogleAdsApi } from 'google-ads-api';
import * as dotenv from 'dotenv';
dotenv.config();

const { GOOGLE_ADS_CLIENT_ID, GOOGLE_ADS_CLIENT_SECRET, GOOGLE_ADS_DEVELOPER_TOKEN,
  GOOGLE_ADS_REFRESH_TOKEN, GOOGLE_ADS_LOGIN_CUSTOMER_ID, GOOGLE_ADS_CUSTOMER_ID } = process.env;

const client = new GoogleAdsApi({
  client_id: GOOGLE_ADS_CLIENT_ID,
  client_secret: GOOGLE_ADS_CLIENT_SECRET,
  developer_token: GOOGLE_ADS_DEVELOPER_TOKEN,
});

const customer = client.Customer({
  customer_id: GOOGLE_ADS_CUSTOMER_ID,
  login_customer_id: GOOGLE_ADS_LOGIN_CUSTOMER_ID,
  refresh_token: GOOGLE_ADS_REFRESH_TOKEN,
});

const LANDING_URL = 'https://refugioanimal.fundsumate.org/jornada-esterilizacion/';
const WA_URL = 'https://api.whatsapp.com/send?phone=573215308188&text=Hola,%20quiero%20agendar%20en%20la%20jornada%20de%20esterilizaci%C3%B3n%20de%20junio';

async function run() {
  console.log('🚀 Creando campaña Jornada Esterilización Junio 2026...\n');

  // ── 1. Campaña ───────────────────────────────────────────────────────────────
  const [campaignRes] = await customer.mutateResources([{
    _resource: 'Campaign',
    name: 'Jornada Esterilización – Junio 2026',
    advertising_channel_type: 2, // SEARCH
    status: 2, // ENABLED
    start_date: '20260601',
    end_date: '20260630',
    target_spend: {},  // maximize clicks
    campaign_budget: {
      amount_micros: 80000000, // $80.000 COP diario (~Ad Grant máximo $329 USD/day)
      delivery_method: 2, // STANDARD
    },
    network_settings: {
      target_google_search: true,
      target_search_network: true,
      target_content_network: false,
    },
    // Ad Grants: max CPC $2 USD = 2000000 micros
    manual_cpc: { enhanced_cpc_enabled: false },
  }]);
  const campaignId = campaignRes.results[0].campaign.id;
  console.log(`✅ Campaña creada: ${campaignId}`);

  // ── 2. Ad Group ──────────────────────────────────────────────────────────────
  const [adGroupRes] = await customer.mutateResources([{
    _resource: 'AdGroup',
    campaign: `customers/${GOOGLE_ADS_CUSTOMER_ID}/campaigns/${campaignId}`,
    name: 'Jornada Esterilización General',
    status: 2, // ENABLED
    type: 2, // SEARCH_STANDARD
    cpc_bid_micros: 2000000, // $2 USD – límite Ad Grants
  }]);
  const adGroupId = adGroupRes.results[0].ad_group.id;
  console.log(`✅ Ad Group creado: ${adGroupId}`);

  // ── 3. Keywords ──────────────────────────────────────────────────────────────
  const keywords = [
    // Intención alta – jornada específica
    { text: 'jornada esterilización medellín', match: 4 },           // EXACT
    { text: 'jornada de esterilización gatos medellín', match: 4 },  // EXACT
    { text: 'jornada esterilización perros medellín', match: 4 },    // EXACT
    { text: 'esterilización bajo costo medellín', match: 4 },        // EXACT
    { text: 'castración bajo costo medellín', match: 4 },            // EXACT
    // Phrase
    { text: 'jornada esterilización', match: 3 },                    // PHRASE
    { text: 'esterilizar gato económico medellín', match: 3 },       // PHRASE
    { text: 'castrar perro bajo costo medellín', match: 3 },         // PHRASE
    { text: 'esterilización barata medellín', match: 3 },            // PHRASE
    { text: 'jornada veterinaria medellín', match: 3 },              // PHRASE
    // Broad match modifier equivalents (phrase)
    { text: 'esterilización perros gatos medellín', match: 3 },
    { text: 'veterinaria esterilización guayabal', match: 3 },
    { text: 'esterilizar mascota precio medellín', match: 3 },
  ];

  const kwResources = keywords.map(kw => ({
    _resource: 'AdGroupCriterion',
    ad_group: `customers/${GOOGLE_ADS_CUSTOMER_ID}/adGroups/${adGroupId}`,
    status: 2, // ENABLED
    keyword: { text: kw.text, match_type: kw.match },
  }));

  await customer.mutateResources(kwResources);
  console.log(`✅ ${keywords.length} keywords añadidas`);

  // ── 4. Negativas de campaña ──────────────────────────────────────────────────
  const negatives = [
    'gratis', 'free', 'adopción', 'adoptar', 'rescate', 'donar', 'donación',
    'voluntario', 'fundación gratuita', 'bogotá', 'cali', 'barranquilla',
  ];
  const negResources = negatives.map(text => ({
    _resource: 'CampaignCriterion',
    campaign: `customers/${GOOGLE_ADS_CUSTOMER_ID}/campaigns/${campaignId}`,
    negative: true,
    keyword: { text, match_type: 3 }, // PHRASE
  }));
  await customer.mutateResources(negResources);
  console.log(`✅ ${negatives.length} negativas añadidas`);

  // ── 5. Anuncio Responsive Search Ad ─────────────────────────────────────────
  await customer.mutateResources([{
    _resource: 'AdGroupAd',
    ad_group: `customers/${GOOGLE_ADS_CUSTOMER_ID}/adGroups/${adGroupId}`,
    status: 2, // ENABLED
    ad: {
      final_urls: [LANDING_URL],
      responsive_search_ad: {
        headlines: [
          { text: 'Esteriliza tu Mascota Desde $80k', pinned_field: 1 }, // pin 1 = HEADLINE_1
          { text: 'Jornada Esterilización Medellín' },
          { text: 'Cirugía + Anestesia + Medicamentos' },
          { text: '27 y 28 Junio · Guayabal' },
          { text: 'Cupos Limitados – Agenda Ya' },
          { text: 'Esterilización Bajo Costo Medellín' },
          { text: 'Gatos Desde $80k · Perros Desde $120k' },
          { text: 'Veterinaria Utopía Animal · Guayabal' },
          { text: 'Previene Enfermedades Graves' },
        ],
        descriptions: [
          { text: 'Gatos: hembra $100k / macho $80k — Perros desde $120k según peso. Cirugía, anestesia y medicamentos incluidos.' },
          { text: 'Cupos limitados para el 27 y 28 de junio. Agenda por WhatsApp ahora. Cra 52 #2 sur-60, Guayabal.' },
          { text: 'Esterilización responsable a precio accesible en Medellín. Profesionales comprometidos con el bienestar animal.' },
          { text: 'No aplica para gestantes ni patologías previas. Ayuno obligatorio previo. ¡No dejes pasar esta oportunidad!' },
        ],
      },
    },
  }]);
  console.log(`✅ Anuncio RSA creado`);

  // ── 6. Sitelinks ─────────────────────────────────────────────────────────────
  // Reutiliza los sitelinks existentes de Vet - Esterilización (campaña 23886159316)
  // y agrega el link directo a la jornada
  const sitelinkAsset = await customer.mutateResources([{
    _resource: 'Asset',
    name: 'Jornada Junio – Precios',
    final_urls: [LANDING_URL],
    sitelink_asset: {
      link_text: 'Ver precios jornada',
      description1: 'Gatos desde $80k · Perros desde $120k',
      description2: '27 y 28 junio · Guayabal · Cupos limitados',
    },
  }]);
  const sitelinkAssetId = sitelinkAsset[0].results[0].asset.id;

  await customer.mutateResources([{
    _resource: 'CampaignAsset',
    campaign: `customers/${GOOGLE_ADS_CUSTOMER_ID}/campaigns/${campaignId}`,
    asset: `customers/${GOOGLE_ADS_CUSTOMER_ID}/assets/${sitelinkAssetId}`,
    field_type: 13, // SITELINK
  }]);
  console.log(`✅ Sitelink "Jornada junio" vinculado`);

  // ── 7. Call extension ────────────────────────────────────────────────────────
  // Asset de llamada (reutiliza el ID 367583036211 si ya existe, o crea uno nuevo)
  const callAsset = await customer.mutateResources([{
    _resource: 'Asset',
    name: 'Llamada Jornada Esterilización',
    call_asset: {
      country_code: 'CO',
      phone_number: '3215308188',
      call_conversion_reporting_state: 2, // USE_ACCOUNT_LEVEL_CALL_CONVERSION_ACTION
    },
  }]);
  const callAssetId = callAsset[0].results[0].asset.id;

  await customer.mutateResources([{
    _resource: 'CampaignAsset',
    campaign: `customers/${GOOGLE_ADS_CUSTOMER_ID}/campaigns/${campaignId}`,
    asset: `customers/${GOOGLE_ADS_CUSTOMER_ID}/assets/${callAssetId}`,
    field_type: 16, // CALL
  }]);
  console.log(`✅ Call extension vinculada`);

  console.log('\n🎉 Campaña Jornada Esterilización creada exitosamente');
  console.log(`   Campaign ID: ${campaignId}`);
  console.log(`   Ad Group ID: ${adGroupId}`);
  console.log(`   Landing URL: ${LANDING_URL}`);
  console.log('\n⚠️  IMPORTANTE: Verifica la campaña en Google Ads UI antes del 1 de junio');
  console.log('   Asegúrate que el budget diario no excede el límite de Ad Grants ($329 USD)');
}

run().catch(err => {
  console.error('Error:', err.errors || err.message);
  process.exit(1);
});
