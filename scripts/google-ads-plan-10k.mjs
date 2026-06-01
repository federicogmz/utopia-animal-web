/**
 * Google Ads - Plan $10,000 USD/mes (Ad Grants)
 * 
 * FASE 1: Subir bids a $2 en todas las campañas activas
 * FASE 2: Crear nuevas campañas de alto volumen
 * FASE 3: Ajustar presupuestos diarios
 */

import { createCustomer, getAdsConfig } from './google-ads/shared.mjs';

const config = getAdsConfig({ requireCustomerId: true });
const customer = createCustomer(config);
const CUSTOMER_ID = config.customerId;

// ==================== FASE 1: FIX BIDS ====================
// Subir CPC a $2 en todos los ad groups activos de campañas VET+Jornada
const VET_AD_GROUPS = [
  { id: '196667153653', name: 'Vet 14/02 → Consulta Vet' },
  { id: '197348025552', name: 'Vet 14/02 → Esterilizaciones' },
  { id: '193636107335', name: 'Vet 14/02 → Grupo general' },
  { id: '201919948012', name: 'Vet 14/02 → Laboratorio Clínico' },
  { id: '200587886830', name: 'Vet 14/02 → Vacunas' },
  { id: '203677040304', name: 'Vet - Cirugía → Grupo' },
  { id: '198357785233', name: 'Vet - Esterilización → Grupo' },
  { id: '195584717463', name: 'Vet - Urgencias → Grupo' },
  { id: '196963855396', name: 'Vet - Vacunas → Grupo' },
];

console.log('\n=== FASE 1: Subir bids a $2.00 ===');
for (const ag of VET_AD_GROUPS) {
  try {
    const result = await customer.adGroups.update([{
      resource_name: `customers/${CUSTOMER_ID}/adGroups/${ag.id}`,
      cpc_bid_micros: 2000000, // $2.00
    }]);
    console.log(`✅ ${ag.name} → $2.00`);
  } catch (e) {
    console.error(`❌ ${ag.name}: ${e.message}`);
  }
}

// ==================== FASE 2: NUEVA CAMPAÑA - Veterinaria Medellín ====================
console.log('\n=== FASE 2: Campaña Vet - Consulta General ===');

// Budget: $100/day
const budgetResult = await customer.campaignBudgets.create([{
  name: `Vet General Budget ${Date.now()}`,
  amount_micros: 100000000, // $100
  delivery_method: 2, // STANDARD
}]);
const budgetRN = budgetResult.results?.[0]?.resource_name || budgetResult.resource_name;
console.log('Budget created:', budgetRN);

// Campaign
const campResult = await customer.campaigns.create([{
  name: 'Vet - Consulta General',
  status: 2, // ENABLED
  advertising_channel_type: 2, // SEARCH
  campaign_budget: budgetRN,
  bidding_strategy_type: 10, // TARGET_SPEND
  target_spend: { cpc_bid_ceiling_micros: 2000000 },
  network_settings: {
    target_google_search: true,
    target_search_network: false,
    target_content_network: false,
  },
  contains_eu_political_advertising: 3,
}]);
const campRN = campResult.results?.[0]?.resource_name || campResult.resource_name;
const campId = campRN.split('/').pop();
console.log('Campaign created:', campId);

// Ad Group
const agResult = await customer.adGroups.create([{
  name: 'Veterinaria Medellín General',
  campaign: campRN,
  status: 2, // ENABLED
  type: 2, // SEARCH_STANDARD
  cpc_bid_micros: 2000000,
}]);
const agRN = agResult.results?.[0]?.resource_name || agResult.resource_name;
const agId = agRN.split('/').pop();
console.log('Ad Group created:', agId);

// Keywords
const keywords = [
  { text: 'veterinaria medellín', match: 4 },
  { text: 'clínica veterinaria medellín', match: 4 },
  { text: 'médico veterinario medellín', match: 4 },
  { text: 'veterinario para gatos medellín', match: 4 },
  { text: 'veterinario felino medellín', match: 4 },
  { text: 'veterinaria gatos medellín', match: 4 },
  { text: 'servicio veterinario medellín', match: 4 },
  { text: 'atención veterinaria medellín', match: 4 },
  { text: 'veterinaria económica medellín', match: 4 },
  { text: 'médico veterinario gatos', match: 4 },
  { text: 'veterinario a domicilio medellín', match: 4 },
  { text: 'hospital veterinario medellín', match: 4 },
];

const kwResult = await customer.adGroupCriteria.create(
  keywords.map(k => ({
    ad_group: agRN,
    status: 2,
    keyword: { text: k.text, match_type: k.match },
  }))
);
console.log(`✅ ${keywords.length} keywords creadas`);

// Ad (RSA)
await customer.adGroupAds.create([{
  ad_group: agRN,
  status: 2,
  ad: {
    final_urls: ['https://refugioanimal.fundsumate.org/veterinaria/'],
    responsive_search_ad: {
      headlines: [
        { text: 'Veterinaria en Medellin', pinned_field: 2 },
        { text: 'Clinica Felina y Canina' },
        { text: 'Atencion Experta para Mascotas' },
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
console.log('✅ RSA creado');

// ==================== FASE 2B: CAMPAÑA EDUCACIÓN FELINA ====================
console.log('\n=== FASE 2B: Campaña Educación Felina ===');

const budgetEd = await customer.campaignBudgets.create([{
  name: `Educacion Felina Budget ${Date.now()}`,
  amount_micros: 50000000, // $50/day
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
console.log('Campaign Educacion created:', campEdId);

const agEd = await customer.adGroups.create([{
  name: 'Cuidados del Gato',
  campaign: campEdRN,
  status: 2,
  type: 2,
  cpc_bid_micros: 2000000,
}]);
const agEdRN = agEd.results?.[0]?.resource_name || agEd.resource_name;

const kwEd = [
  { text: 'cómo cuidar a un gato', match: 4 },
  { text: 'cuidados del gato', match: 4 },
  { text: 'alimentación gatos saludable', match: 4 },
  { text: 'salud del gato', match: 4 },
  { text: 'enfermedades comunes en gatos', match: 4 },
  { text: 'síntomas de gato enfermo', match: 4 },
  { text: 'vacunas obligatorias para gatos', match: 4 },
  { text: 'esterilizar gato cuándo', match: 4 },
  { text: 'comportamiento del gato', match: 4 },
  { text: 'guía para dueños de gatos', match: 4 },
];
await customer.adGroupCriteria.create(
  kwEd.map(k => ({ ad_group: agEdRN, status: 2, keyword: { text: k.text, match_type: k.match } }))
);
console.log(`✅ ${kwEd.length} keywords educacion felina`);

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

// ==================== FASE 3: AJUSTAR PRESUPUESTOS ====================
console.log('\n=== FASE 3: Ajuste de presupuestos ===');

// Get current campaign budget resource names
const campRows = await customer.query(`
  SELECT campaign.id, campaign.name, campaign.campaign_budget, campaign_budget.id
  FROM campaign
  WHERE campaign.status = 2
`);

const budgetMap = {};
for (const r of campRows) {
  budgetMap[r.campaign.id] = {
    name: r.campaign.name,
    budgetRN: r.campaign.campaign_budget,
    budgetId: r.campaign_budget?.id,
  };
}

// Target daily budgets for $333/day total
const targetBudgets = {
  '23569976773': 80000000,  // Vet 14/02: $80/day
  '23876666100': 40000000,  // Vet Vacunas: $40/day
  '23878284642': 40000000,  // Vet Cirugia: $40/day
  '23886159316': 40000000,  // Vet Esterilización: $40/day
  '23886212521': 30000000,  // Vet Urgencias: $30/day
  '23888137164': 30000000,  // Jornada Esterilización: $30/day
  // Vet Consulta General: $100/day (ya creado)
  // Educacion Felina: $50/day (ya creado)
  // Total: $450/day → ~$13,500/month (buffer para subgasto típico del 25-30%)
};

for (const [campId, amountMicros] of Object.entries(targetBudgets)) {
  const info = budgetMap[campId];
  if (!info?.budgetRN) { console.log(`⚠️ No budget for campaign ${campId}`); continue; }
  try {
    await customer.campaignBudgets.update([{
      resource_name: info.budgetRN,
      amount_micros: amountMicros,
    }]);
    const usd = (amountMicros / 1e6).toFixed(0);
    console.log(`✅ ${info.name}: $${usd}/day`);
  } catch (e) {
    console.error(`❌ ${info.name}: ${e.message}`);
  }
}

console.log('\n=== RESUMEN DEL PLAN $10K ===');
console.log('Vet - Consulta General (nueva):  $100/day');
console.log('Utopía Animal Vet 14/02/2026:    $80/day');
console.log('Educacion Felina (nueva):        $50/day');
console.log('Vet - Cirugía:                   $40/day');
console.log('Vet - Esterilización:            $40/day');
console.log('Vet - Vacunas:                   $40/day');
console.log('Vet - Urgencias:                 $30/day');
console.log('Jornada Esterilización:          $30/day');
console.log('─────────────────────────────────────────');
console.log('TOTAL PRESUPUESTO:               $410/day = ~$12,300/month');
console.log('TARGET REAL (con subgasto 20%):  ~$9,800/month');
console.log('\nFix bids: $2.00 → esperar 24-48h para ver resultados');
