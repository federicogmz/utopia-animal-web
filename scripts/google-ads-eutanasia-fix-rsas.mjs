/**
 * Fix: Añade RSAs a los ad groups de eutanasia ya creados
 * (la primera ejecución creó los ad groups y keywords pero los RSAs fallaron por longitud)
 *
 * Uso: node scripts/google-ads-eutanasia-fix-rsas.mjs
 */
import { createCustomer, getAdsConfig } from './google-ads/shared.mjs';

const LANDING_PERROS = 'https://refugioanimal.fundsumate.org/eutanasia-perros/';
const LANDING_GATOS = 'https://refugioanimal.fundsumate.org/eutanasia-gatos/';
const CAMPAIGN_ID = 23569976773;

async function run() {
  const config = getAdsConfig({ requireCustomerId: true });
  const customer = createCustomer(config);

  console.log('🔍 Buscando ad groups existentes...\n');

  const adGroupRows = await customer.query(`
    SELECT ad_group.id, ad_group.name, ad_group.resource_name
    FROM ad_group
    WHERE campaign.id = ${CAMPAIGN_ID}
      AND ad_group.name IN ("Eutanasia – Perros", "Eutanasia – Gatos")
      AND ad_group.status = "ENABLED"
  `);

  console.log(`✅ ${adGroupRows.length} ad groups encontrados:\n`);

  for (const row of adGroupRows) {
    const name = row.ad_group.name;
    const rn = row.ad_group.resource_name;
    const isPerros = name.includes('Perros');
    const landingUrl = isPerros ? LANDING_PERROS : LANDING_GATOS;
    const especie = isPerros ? 'Perros' : 'Gatos';

    console.log(`▶ Creando RSA para "${name}"...`);

    try {
      await customer.adGroupAds.create([{
        ad_group: rn,
        status: 2,
        ad: {
          final_urls: [landingUrl],
          responsive_search_ad: {
            headlines: [
              { text: `Eutanasia Digna ${especie}`, pinned_field: 2 },
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
              { text: 'Evaluamos calidad de vida sin costo. Procedimiento compasivo en Medellín.' },
              { text: 'A domicilio o en clínica. Te acompañamos en cada paso. Escríbenos a WhatsApp.' },
            ],
          },
        },
      }]);
      console.log(`   ✅ RSA creado\n`);
    } catch (err) {
      console.error(`   ❌ Error:`, err.errors ? JSON.stringify(err.errors) : err.message);
    }
  }

  console.log('🎉 RSAs añadidos a los ad groups de eutanasia');
}

run().catch(err => {
  console.error('Error:', err.errors || err.message || err);
  process.exit(1);
});
