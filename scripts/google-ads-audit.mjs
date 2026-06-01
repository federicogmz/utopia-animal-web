import {
  buildMainSiteUrl,
  buildReferenceTerms,
  createCustomer,
  evaluateMessageMatch,
  fetchPageProfile,
  formatMoneyCOP,
  getAdsConfig,
  getDateRange,
  parseAuditArgs,
  readField,
  suggestMainSitePath,
  toTextArray,
  writeOutputFile,
} from "./google-ads/shared.mjs";

async function main() {
  const options = parseAuditArgs(process.argv.slice(2));
  const config = getAdsConfig({ requireCustomerId: true });
  const customer = createCustomer(config);
  const { start, end } = getDateRange(options.days);

  const [campaignRows, adRows, keywordRows] = await Promise.all([
    customer.query(`
      SELECT
        campaign.id,
        campaign.name,
        campaign.status,
        campaign.advertising_channel_type,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions
      FROM campaign
      WHERE campaign.status = "ENABLED"
        AND segments.date BETWEEN "${start}" AND "${end}"
    `),
    customer.query(`
      SELECT
        campaign.id,
        campaign.name,
        ad_group.id,
        ad_group.name,
        ad_group_ad.ad.id,
        ad_group_ad.ad.type,
        ad_group_ad.status,
        ad_group_ad.ad.final_urls,
        ad_group_ad.ad.final_mobile_urls,
        ad_group_ad.ad.responsive_search_ad.headlines,
        ad_group_ad.ad.responsive_search_ad.descriptions
      FROM ad_group_ad
      WHERE campaign.status = "ENABLED"
        AND ad_group.status = "ENABLED"
        AND ad_group_ad.status = "ENABLED"
    `),
    customer.query(`
      SELECT
        campaign.id,
        ad_group.id,
        ad_group_criterion.keyword.text
      FROM ad_group_criterion
      WHERE campaign.status = "ENABLED"
        AND ad_group.status = "ENABLED"
        AND ad_group_criterion.type = "KEYWORD"
        AND ad_group_criterion.status = "ENABLED"
    `),
  ]);

  const keywordsByAdGroup = buildKeywordsByAdGroup(keywordRows);
  const pageCache = new Map();
  const campaigns = [];

  for (const campaignRow of campaignRows) {
    const campaignId = String(readField(campaignRow, "campaign.id"));
    const campaignName = readField(campaignRow, "campaign.name") ?? "";
    const matchingAds = adRows.filter((row) => String(readField(row, "campaign.id")) === campaignId);
    const landingAudits = [];

    for (const adRow of matchingAds) {
      const adGroupId = String(readField(adRow, "ad_group.id"));
      const adGroupName = readField(adRow, "ad_group.name") ?? "";
      const headlines = toTextArray(readField(adRow, "ad_group_ad.ad.responsive_search_ad.headlines"));
      const descriptions = toTextArray(readField(adRow, "ad_group_ad.ad.responsive_search_ad.descriptions"));
      const keywords = keywordsByAdGroup.get(`${campaignId}:${adGroupId}`) ?? [];
      const referenceTerms = buildReferenceTerms({
        campaignName,
        adGroupName,
        headlines,
        descriptions,
        keywords,
      });
      const finalUrls = [
        ...toTextArray(readField(adRow, "ad_group_ad.ad.final_urls")),
        ...toTextArray(readField(adRow, "ad_group_ad.ad.final_mobile_urls")),
      ];

      for (const finalUrl of [...new Set(finalUrls)]) {
        landingAudits.push(
          await inspectLanding({
            finalUrl,
            referenceTerms,
            bridgeSiteUrl: config.bridgeSiteUrl,
            mainSiteUrl: config.mainSiteUrl,
            pageCache,
          }),
        );
      }
    }

    campaigns.push({
      campaignId,
      campaignName,
      channel: readField(campaignRow, "campaign.advertising_channel_type") ?? "",
      impressions: Number(readField(campaignRow, "metrics.impressions") ?? 0),
      clicks: Number(readField(campaignRow, "metrics.clicks") ?? 0),
      conversions: Number(readField(campaignRow, "metrics.conversions") ?? 0),
      costMicros: Number(readField(campaignRow, "metrics.cost_micros") ?? 0),
      landingAudits,
    });
  }

  const report = {
    generatedAt: new Date().toISOString(),
    customerId: config.customerId,
    dateRange: { start, end },
    bridgeSiteUrl: config.bridgeSiteUrl,
    mainSiteUrl: config.mainSiteUrl,
    campaignCount: campaigns.length,
    campaigns,
  };

  const content = options.json ? JSON.stringify(report, null, 2) : formatMarkdownReport(report);
  if (options.out) {
    const savedPath = await writeOutputFile(options.out, content);
    console.error(`Reporte guardado en ${savedPath}`);
  }

  console.log(content);
}

async function inspectLanding({ finalUrl, referenceTerms, bridgeSiteUrl, mainSiteUrl, pageCache }) {
  const currentPageResult = await getOrFetchPage(finalUrl, pageCache);
  const suggestedMainPath = suggestMainSitePath(referenceTerms);
  const suggestedMainUrl = buildMainSiteUrl(mainSiteUrl, suggestedMainPath);
  const mainSitePageResult = await getOrFetchPage(suggestedMainUrl, pageCache);
  const notes = [];

  const currentMatch = currentPageResult.ok
    ? evaluateMessageMatch(referenceTerms, currentPageResult.page)
    : emptyMatch();
  const mainSiteMatch = mainSitePageResult.ok
    ? evaluateMessageMatch(referenceTerms, mainSitePageResult.page)
    : emptyMatch();

  if (!currentPageResult.ok) {
    notes.push(`No se pudo leer la landing actual: ${currentPageResult.error}`);
  }
  if (!mainSitePageResult.ok) {
    notes.push(`No se pudo leer la ruta sugerida en la web principal: ${mainSitePageResult.error}`);
  }
  if (currentPageResult.ok && currentMatch.score < 40) {
    notes.push("La landing actual tiene bajo message match con anuncio + keywords.");
  }
  if (currentPageResult.ok && mainSitePageResult.ok && mainSiteMatch.score >= currentMatch.score + 15) {
    notes.push("La ruta sugerida de utopianimal.org alinea mejor la intención que la landing actual.");
  }
  if (
    currentPageResult.ok &&
    !currentPageResult.page.url.startsWith(bridgeSiteUrl) &&
    !currentPageResult.page.url.startsWith(mainSiteUrl)
  ) {
    notes.push("La URL final no pertenece a las propiedades documentadas del ecosistema.");
  }

  return {
    finalUrl,
    resolvedUrl: currentPageResult.ok ? currentPageResult.page.url : finalUrl,
    currentPage: {
      title: currentPageResult.ok ? currentPageResult.page.title : "",
      h1: currentPageResult.ok ? currentPageResult.page.h1 : [],
      score: currentMatch.score,
      status: currentMatch.status,
      matchedTerms: currentMatch.matchedTerms,
      missingTerms: currentMatch.missingTerms,
    },
    suggestedMainSiteUrl: suggestedMainUrl,
    suggestedMainSite: {
      title: mainSitePageResult.ok ? mainSitePageResult.page.title : "",
      h1: mainSitePageResult.ok ? mainSitePageResult.page.h1 : [],
      score: mainSiteMatch.score,
      status: mainSiteMatch.status,
      matchedTerms: mainSiteMatch.matchedTerms,
      missingTerms: mainSiteMatch.missingTerms,
    },
    notes,
  };
}

async function getOrFetchPage(url, cache) {
  if (!cache.has(url)) {
    cache.set(
      url,
      fetchPageProfile(url)
        .then((page) => ({ ok: true, page }))
        .catch((error) => ({ ok: false, error: error.message })),
    );
  }

  return cache.get(url);
}

function emptyMatch() {
  return {
    score: 0,
    status: "error",
    matchedTerms: [],
    missingTerms: [],
  };
}

function buildKeywordsByAdGroup(keywordRows) {
  const keywordsByAdGroup = new Map();

  for (const row of keywordRows) {
    const campaignId = String(readField(row, "campaign.id"));
    const adGroupId = String(readField(row, "ad_group.id"));
    const keyword = readField(row, "ad_group_criterion.keyword.text");
    const key = `${campaignId}:${adGroupId}`;

    if (!keywordsByAdGroup.has(key)) {
      keywordsByAdGroup.set(key, []);
    }

    if (keyword) {
      keywordsByAdGroup.get(key).push(keyword);
    }
  }

  return keywordsByAdGroup;
}

function formatMarkdownReport(report) {
  const lines = [
    "# Auditoría Google Ads vs landings",
    "",
    `- **Customer ID:** ${report.customerId}`,
    `- **Rango:** ${report.dateRange.start} → ${report.dateRange.end}`,
    `- **Landing puente:** ${report.bridgeSiteUrl}`,
    `- **Web principal:** ${report.mainSiteUrl}`,
    `- **Campañas activas:** ${report.campaignCount}`,
    "",
  ];

  for (const campaign of report.campaigns) {
    lines.push(`## ${campaign.campaignName}`);
    lines.push("");
    lines.push(
      `**Canal:** ${campaign.channel} · **Clicks:** ${campaign.clicks} · **Impresiones:** ${campaign.impressions} · **Conversiones:** ${campaign.conversions} · **Costo:** ${formatMoneyCOP(campaign.costMicros)}`,
    );
    lines.push("");

    if (campaign.landingAudits.length === 0) {
      lines.push("Sin anuncios activos o sin final URLs detectadas.");
      lines.push("");
      continue;
    }

    for (const audit of campaign.landingAudits) {
      lines.push(`### ${audit.finalUrl}`);
      lines.push("");
      lines.push(`- **Landing actual:** ${audit.currentPage.score}/100 (${audit.currentPage.status})`);
      lines.push(`- **Ruta sugerida en utopianimal.org:** ${audit.suggestedMainSiteUrl}`);
      lines.push(`- **Comparativo web principal:** ${audit.suggestedMainSite.score}/100 (${audit.suggestedMainSite.status})`);
      lines.push(`- **Title actual:** ${audit.currentPage.title || "Sin title detectable"}`);
      lines.push(
        `- **Términos faltantes en landing actual:** ${audit.currentPage.missingTerms.length > 0 ? audit.currentPage.missingTerms.join(", ") : "Ninguno"}`,
      );
      if (audit.notes.length > 0) {
        lines.push(`- **Hallazgos:** ${audit.notes.join(" ")}`);
      }
      lines.push("");
    }
  }

  return lines.join("\n");
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
