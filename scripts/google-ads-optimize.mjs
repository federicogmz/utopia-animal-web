/**
 * Optimización de campañas Google Ads — Utopía Animal
 *
 * Acciones:
 *  1. Pausa campaña Elim 04/09/2024
 *  2. Agrega palabras negativas a todas las campañas Vet
 *  3. Limpia keywords basura de Vet - Cirugía y mejora el anuncio
 *  4. Vincula extensión de llamada (+57 321 530 8188) a campañas Vet sin ella
 *  5. Crea y vincula sitelinks a campañas Vet sin sitelinks
 */

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '../.env') });
import { createCustomer, getAdsConfig } from './google-ads/shared.mjs';

const CUSTOMER_ID = process.env.GOOGLE_ADS_CUSTOMER_ID;
const customerId = `customers/${CUSTOMER_ID}`;

// IDs conocidos
const CAMPAIGN_IDS = {
  elim:          '21662036619',
  vetPrincipal:  '23569976773',
  vetVacunas:    '23876666100',
  vetCirugia:    '23878284642',
  vetEsteril:    '23886159316',
  vetUrgencias:  '23886212521',
};

// Call asset 321 530 8188 (ya existe en la cuenta)
const CALL_ASSET_RESOURCE = `${customerId}/assets/362433054470`;

// Campañas vet que necesitan call asset
const VET_CAMPAIGNS_NEED_CALL = [
  CAMPAIGN_IDS.vetVacunas,
  CAMPAIGN_IDS.vetCirugia,
  CAMPAIGN_IDS.vetEsteril,
  CAMPAIGN_IDS.vetUrgencias,
];

// Todas las campañas vet para negativas
const ALL_VET_CAMPAIGNS = Object.entries(CAMPAIGN_IDS)
  .filter(([k]) => k !== 'elim')
  .map(([, id]) => id);

const NEGATIVE_KEYWORDS = [
  'gratis',
  'gratuito',
  'gratuita',
  'alcaldía',
  'alcaldia',
  'gobierno',
  'del ces',
  'adopción',
  'adopcion',
  'adoptar',
  'siamés',
  'siames',
  'fundación la perla',
  'la perla',
  'hogar de alicia',
  'lombricompostaje',
  '24 horas',
];

// Keywords basura en Vet-Cirugía a remover (resource names se construyen después)
const JUNK_KEYWORDS_CIRUGIA = new Set([
  'veterinaria vet',
  'vet veterinaria',
  'vet vet',
  'veterinaria vet vet',
  'animal vet veterinaria',
  'veterinaria animal vet',
  'av veterinaria',
  'veterinaria av',
  'refugio veterinaria',
  'veterinaria refugio',
  'el refugio veterinaria',
  'vet animal',
]);

// Sitelinks para campañas vet sin sitelinks
const SITELINKS = [
  {
    link_text: 'Consulta Veterinaria',
    final_urls: ['https://refugioanimal.fundsumate.org/veterinaria-medellin-utopia-animal/'],
    description1: 'Consulta desde $49.000',
    description2: 'Av. Guayabal, Medellín',
  },
  {
    link_text: 'Vacunas Perros y Gatos',
    final_urls: ['https://refugioanimal.fundsumate.org/vacunas-perros-gatos/'],
    description1: 'Esquemas completos disponibles',
    description2: 'Agenda tu cita hoy',
  },
  {
    link_text: 'Cirugía Veterinaria',
    final_urls: ['https://refugioanimal.fundsumate.org/cirugia-veterinaria/'],
    description1: 'Quirófano equipado',
    description2: 'Esterilización y más',
  },
  {
    link_text: 'Urgencias Veterinarias',
    final_urls: ['https://refugioanimal.fundsumate.org/urgencias-veterinarias/'],
    description1: 'Atención de urgencias',
    description2: 'Cra. 52 #2 Sur 60, Medellín',
  },
];

async function main() {
  const config = getAdsConfig({ requireCustomerId: true });
  const customer = createCustomer(config);

  // ── 1. PAUSAR ELIM 04/09/2024 ──────────────────────────────────────────────
  console.log('\n▶ 1. Pausando campaña Elim 04/09/2024...');
  try {
    await customer.campaigns.update([{
      resource_name: `${customerId}/campaigns/${CAMPAIGN_IDS.elim}`,
      status: 3, // PAUSED
    }]);
    console.log('   ✅ Pausada');
  } catch (err) {
    console.error('   ❌', err.message);
  }

  // ── 2. PALABRAS NEGATIVAS EN CAMPAÑAS VET ─────────────────────────────────
  console.log('\n▶ 2. Agregando palabras negativas a campañas Vet...');
  const negatives = [];
  for (const campaignId of ALL_VET_CAMPAIGNS) {
    for (const kw of NEGATIVE_KEYWORDS) {
      negatives.push({
        campaign: `${customerId}/campaigns/${campaignId}`,
        negative: true,
        keyword: { text: kw, match_type: 2 }, // BROAD
      });
    }
  }
  try {
    const resp = await customer.campaignCriteria.create(negatives, { partial_failure: true });
    const failed = resp.partial_failure_error?.details?.length || 0;
    const ok = negatives.length - failed;
    console.log(`   ✅ ${ok}/${negatives.length} negativas creadas${failed ? ` (${failed} ya existían o duplicadas)` : ''}`);
  } catch (err) {
    console.error('   ❌', err.message);
  }

  // ── 3. LIMPIAR KEYWORDS BASURA EN VET-CIRUGÍA ─────────────────────────────
  console.log('\n▶ 3. Limpiando keywords basura en Vet - Cirugía...');
  try {
    const kwRows = await customer.query(`
      SELECT ad_group_criterion.resource_name, ad_group_criterion.keyword.text
      FROM ad_group_criterion
      WHERE campaign.id = ${CAMPAIGN_IDS.vetCirugia}
        AND ad_group_criterion.type = "KEYWORD"
        AND ad_group_criterion.status != "REMOVED"
    `);
    const toRemove = kwRows
      .filter(r => JUNK_KEYWORDS_CIRUGIA.has(r.ad_group_criterion.keyword.text.toLowerCase()))
      .map(r => r.ad_group_criterion.resource_name);

    if (toRemove.length === 0) {
      console.log('   ✅ No hay keywords basura (ya limpias)');
    } else {
      await customer.adGroupCriteria.remove(toRemove, { partial_failure: true });
      console.log(`   ✅ ${toRemove.length} keywords eliminadas: ${toRemove.length > 0 ? '\n      ' + kwRows.filter(r => JUNK_KEYWORDS_CIRUGIA.has(r.ad_group_criterion.keyword.text.toLowerCase())).map(r => `"${r.ad_group_criterion.keyword.text}"`).join(', ') : ''}`);
    }
  } catch (err) {
    console.error('   ❌', err.message);
  }

  // ── 4. VINCULAR CALL ASSET A CAMPAÑAS VET ─────────────────────────────────
  console.log('\n▶ 4. Vinculando extensión de llamada (+57 321 530 8188) a campañas Vet...');
  const callLinks = VET_CAMPAIGNS_NEED_CALL.map(campaignId => ({
    campaign: `${customerId}/campaigns/${campaignId}`,
    asset: CALL_ASSET_RESOURCE,
    field_type: 16, // CALL = 16 en AssetFieldType enum
  }));
  try {
    const resp = await customer.campaignAssets.create(callLinks, { partial_failure: true });
    const failed = resp.partial_failure_error?.details?.length || 0;
    console.log(`   ✅ ${callLinks.length - failed}/${callLinks.length} campañas con llamada${failed ? ` (${failed} ya vinculadas)` : ''}`);
  } catch (err) {
    console.error('   ❌', err.message);
  }

  // ── 5. CREAR Y VINCULAR SITELINKS A CAMPAÑAS VET SIN SITELINKS ────────────
  console.log('\n▶ 5. Creando sitelinks para campañas Vet...');

  // Campañas que NO tienen sitelinks todavía
  const campaignsNeedSitelinks = [
    CAMPAIGN_IDS.vetVacunas,
    CAMPAIGN_IDS.vetCirugia,
    CAMPAIGN_IDS.vetEsteril,
    CAMPAIGN_IDS.vetUrgencias,
  ];

  try {
    // Crear los assets de sitelink
    const sitelinkAssets = await customer.assets.create(
      SITELINKS.map(sl => ({
        final_urls: sl.final_urls,
        sitelink_asset: {
          link_text: sl.link_text,
          description1: sl.description1,
          description2: sl.description2,
        },
      })),
      { response_content_type: 2, partial_failure: true }
    );

    const assetResourceNames = sitelinkAssets.results?.map(r => r.resource_name).filter(Boolean) || [];
    console.log(`   ✅ ${assetResourceNames.length} sitelink assets creados`);

    if (assetResourceNames.length > 0) {
      // Vincular cada sitelink a cada campaña que lo necesita
      const links = [];
      for (const campaignId of campaignsNeedSitelinks) {
        for (const assetRN of assetResourceNames) {
          links.push({
            campaign: `${customerId}/campaigns/${campaignId}`,
            asset: assetRN,
            field_type: 13, // SITELINK = 13 en AssetFieldType enum
          });
        }
      }

      const resp = await customer.campaignAssets.create(links, { partial_failure: true });
      const failed = resp.partial_failure_error?.details?.length || 0;
      console.log(`   ✅ ${links.length - failed}/${links.length} sitelinks vinculados a campañas`);
    }
  } catch (err) {
    console.error('   ❌', err.message);
  }

  // ── VERIFICACIÓN FINAL ────────────────────────────────────────────────────
  console.log('\n▶ Verificación final...');
  const finalStatus = await customer.query(`
    SELECT campaign.id, campaign.name, campaign.status
    FROM campaign
    WHERE campaign.id IN (${Object.values(CAMPAIGN_IDS).join(',')})
    ORDER BY campaign.name
  `);
  const statusMap = { 2: 'ENABLED', 3: 'PAUSED', 4: 'REMOVED' };
  for (const r of finalStatus) {
    const s = statusMap[r.campaign.status] || r.campaign.status;
    const icon = s === 'ENABLED' ? '🟢' : s === 'PAUSED' ? '⏸️' : '🔴';
    console.log(`   ${icon} [${s}] ${r.campaign.name}`);
  }

  console.log('\n✅ Optimización completada.\n');
}

main().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
