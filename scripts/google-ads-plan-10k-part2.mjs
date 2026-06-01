/**
 * Plan $10k - Parte 2: Fix bids + RSA pendientes + Educacion Felina + Presupuestos
 */
import { createCustomer, getAdsConfig } from './google-ads/shared.mjs';

const config = getAdsConfig({ requireCustomerId: true });
const customer = createCustomer(config);
const CUSTOMER_ID = config.customerId;

// ==================== 1: FIX BIDS $2 ====================
console.log('=== 1: Subir bids a $2.00 en campañas vet ===');
const VET_ADS = [
  '196667153653','197348025552','193636107335','201919948012',
  '200587886830','203677040304','198357785233','195584717463','196963855396',
];
const bidUpdates = VET_ADS.map(id => ({
  resource_name: `customers/${CUSTOMER_ID}/adGroups/${id}`,
  cpc_bid_micros: 2000000,
}));
try {
  const r = await customer.adGroups.update(bidUpdates);
  console.log(`✅ Bids actualizados: ${r.results?.length || 'ok'}`);
} catch(e) {
  console.error('❌ bids:', e.errors?.[0]?.message || e.message);
}

// ==================== 2: RSA para Vet - Consulta General ====================
console.log('\n=== 2: RSA Vet - Consulta General ===');
const AG_VET_GENERAL = '197189772939';
try {
  await customer.adGroupAds.create([{
    ad_group: `customers/${CUSTOMER_ID}/adGroups/${AG_VET_GENERAL}`,
    status: 2,
    ad: {
      final_urls: ['https://refugioanimal.fundsumate.org/veterinaria/'],
      responsive_search_ad: {
        headlines: [
          { text: 'Veterinaria en Medellin', pinned_field: 2 },
          { text: 'Clinica Felina y Canina' },
          { text: 'Atencion Experta Mascotas' },
          { text: 'Medicos Veterinarios Certificados' },
          { text: 'Consulta Vacunas y Cirugia' },
          { text: 'Reserva tu Cita Hoy' },
          { text: 'Precios Accesibles Medellin' },
        ],
        descriptions: [
          { text: 'Clinica veterinaria en Medellin. Consultas, vacunas, cirugias y mas. Agenda tu cita por WhatsApp.' },
          { text: 'Atencion integral para gatos y perros. Medicos veterinarios con experiencia. Llama ahora.' },
        ],
      },
    },
  }]);
  console.log('✅ RSA Vet General creado');
} catch(e) {
  console.error('❌ RSA Vet General:', e.errors?.[0]?.message || e.message);
}

// ==================== 3: CAMPAÑA EDUCACION FELINA ====================
console.log('\n=== 3: Campaña Educacion Felina ===');
const budgetEd = await customer.campaignBudgets.create([{
  name: `Educacion Felina Budget ${Date.now()}`,
  amount_micros: 50000000,
  delivery_method: 2,
}]);
const budgetEdRN = budgetEd.results?.[0]?.resource_name || budgetEd.resource_name;

const campEd = await customer.campaigns.create([{
  name: 'Educacion Felina',
  status: 2,
  advertising_channel_type: 2,
  campaign_budget: budgetEdRN,
  bidding_strategy_type: 10,
  target_spend: { cpc_bid_ceiling_micros: 2000000 },
  network_settings: {
    target_google_search: true,
    target_search_network: false,
    target_content_network: false,
  },
  contains_eu_political_advertising: 3,
}]);
const campEdRN = campEd.results?.[0]?.resource_name || campEd.resource_name;
const campEdId = campEdRN.split('/').pop();
console.log('Campaign Educacion:', campEdId);

const agEd = await customer.adGroups.create([{
  name: 'Cuidados del Gato',
  campaign: campEdRN,
  status: 2,
  type: 2,
  cpc_bid_micros: 2000000,
}]);
const agEdRN = agEd.results?.[0]?.resource_name || agEd.resource_name;
const agEdId = agEdRN.split('/').pop();
console.log('AdGroup Educacion:', agEdId);

const kwEd = [
  'como cuidar a un gato',
  'cuidados del gato',
  'alimentacion gatos saludable',
  'salud del gato',
  'enfermedades comunes en gatos',
  'sintomas de gato enfermo',
  'vacunas obligatorias para gatos',
  'esterilizar gato cuando',
  'comportamiento del gato',
  'guia para duenos de gatos',
];
await customer.adGroupCriteria.create(
  kwEd.map(text => ({ ad_group: agEdRN, status: 2, keyword: { text, match_type: 4 } }))
);
console.log(`✅ ${kwEd.length} keywords educacion`);

await customer.adGroupAds.create([{
  ad_group: agEdRN,
  status: 2,
  ad: {
    final_urls: ['https://refugioanimal.fundsumate.org/educacion-felina/'],
    responsive_search_ad: {
      headlines: [
        { text: 'Aprende a Cuidar a tu Gato', pinned_field: 2 },
        { text: 'Guia Completa de Salud Felina' },
        { text: 'Consejos de Veterinarios Expertos' },
        { text: 'Vacunas Alimentacion y Bienestar' },
        { text: 'Todo sobre el Cuidado Felino' },
        { text: 'Tips de Bienestar para tu Gato' },
        { text: 'Educacion Felina Gratuita' },
      ],
      descriptions: [
        { text: 'Aprende a cuidar a tu gato con guias de veterinarios. Vacunas, alimentacion, comportamiento y mas.' },
        { text: 'Recursos gratuitos sobre salud felina. Consulta con nuestros veterinarios en Medellin.' },
      ],
    },
  },
}]);
console.log('✅ RSA Educacion creado');

// ==================== 4: AJUSTAR PRESUPUESTOS ====================
console.log('\n=== 4: Ajuste de presupuestos ===');

const campRows = await customer.query(`
  SELECT campaign.id, campaign.name, campaign.campaign_budget
  FROM campaign
`);
const budgetMap = {};
for (const r of campRows) {
  budgetMap[r.campaign.id] = { name: r.campaign.name, budgetRN: r.campaign.campaign_budget };
}

const targets = {
  '23569976773': [80000000, 'Vet 14/02 $80/day'],
  '23876666100': [40000000, 'Vet Vacunas $40/day'],
  '23878284642': [40000000, 'Vet Cirugia $40/day'],
  '23886159316': [40000000, 'Vet Esterilizacion $40/day'],
  '23886212521': [30000000, 'Vet Urgencias $30/day'],
  '23888137164': [30000000, 'Jornada Esterilizacion $30/day'],
};

for (const [cId, [micros, label]] of Object.entries(targets)) {
  const info = budgetMap[cId];
  if (!info?.budgetRN) { console.log(`⚠️ No budget RN for ${cId}`); continue; }
  try {
    await customer.campaignBudgets.update([{
      resource_name: info.budgetRN,
      amount_micros: micros,
    }]);
    console.log(`✅ ${label}`);
  } catch(e) {
    console.error(`❌ ${label}:`, e.errors?.[0]?.message || e.message);
  }
}

console.log('\n=== RESUMEN PLAN $10K/MES ===');
console.log('CAMPAÑA                         PRESUPUESTO');
console.log('─────────────────────────────────────────────');
console.log('Vet - Consulta General (nueva)  $100/día');
console.log('Utopía Animal Vet 14/02/2026    $80/día');
console.log('Educacion Felina (nueva)        $50/día');
console.log('Vet - Cirugía                   $40/día');
console.log('Vet - Esterilización            $40/día');
console.log('Vet - Vacunas                   $40/día');
console.log('Vet - Urgencias                 $30/día');
console.log('Jornada Esterilización          $30/día');
console.log('─────────────────────────────────────────────');
console.log('TOTAL PRESUPUESTO               $410/día');
console.log('PROYECCIÓN MENSUAL (80% uso)    ~$9,840/mes');
console.log('');
console.log('CRÍTICO: bids en $2.00 → tráfico debe aumentar 24-48h');
