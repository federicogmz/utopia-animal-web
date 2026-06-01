import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), "../.env") });

import { mkdir, writeFile } from "node:fs/promises";

import { GoogleAdsApi } from "google-ads-api";

const STOPWORDS = new Set([
  "a",
  "al",
  "algo",
  "ante",
  "como",
  "con",
  "contra",
  "cual",
  "cuando",
  "de",
  "del",
  "desde",
  "donde",
  "dos",
  "el",
  "ella",
  "ellas",
  "ellos",
  "en",
  "entre",
  "era",
  "es",
  "esa",
  "ese",
  "eso",
  "esta",
  "este",
  "esto",
  "fundacion",
  "gatos",
  "gran",
  "hacia",
  "hola",
  "la",
  "las",
  "lo",
  "los",
  "mas",
  "medellin",
  "mi",
  "muy",
  "no",
  "nos",
  "nuestra",
  "nuestro",
  "para",
  "pero",
  "por",
  "que",
  "se",
  "ser",
  "si",
  "sin",
  "sobre",
  "su",
  "sus",
  "te",
  "tu",
  "una",
  "uno",
  "unos",
  "utopia",
  "vet",
  "web",
  "y",
]);

const DEFAULT_BRIDGE_SITE_URL = "https://refugioanimal.fundsumate.org/";
const DEFAULT_MAIN_SITE_URL = "https://utopianimal.org/";

export function getAdsConfig({ requireCustomerId = false } = {}) {
  const config = {
    clientId: process.env.GOOGLE_ADS_CLIENT_ID?.trim() ?? "",
    clientSecret: process.env.GOOGLE_ADS_CLIENT_SECRET?.trim() ?? "",
    developerToken: process.env.GOOGLE_ADS_DEVELOPER_TOKEN?.trim() ?? "",
    refreshToken: process.env.GOOGLE_ADS_REFRESH_TOKEN?.trim() ?? "",
    customerId: normalizeCustomerId(process.env.GOOGLE_ADS_CUSTOMER_ID),
    loginCustomerId: normalizeCustomerId(process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID),
    bridgeSiteUrl: process.env.ADS_BRIDGE_SITE_URL?.trim() || DEFAULT_BRIDGE_SITE_URL,
    mainSiteUrl: process.env.ADS_MAIN_SITE_URL?.trim() || DEFAULT_MAIN_SITE_URL,
  };

  const missing = [
    !config.clientId && "GOOGLE_ADS_CLIENT_ID",
    !config.clientSecret && "GOOGLE_ADS_CLIENT_SECRET",
    !config.developerToken && "GOOGLE_ADS_DEVELOPER_TOKEN",
    !config.refreshToken && "GOOGLE_ADS_REFRESH_TOKEN",
    requireCustomerId && !config.customerId && "GOOGLE_ADS_CUSTOMER_ID",
  ].filter(Boolean);

  if (missing.length > 0) {
    throw new Error(
      `Faltan variables de entorno requeridas: ${missing.join(", ")}. Copia .env.example a .env y completa los valores reales.`,
    );
  }

  return config;
}

export function createGoogleAdsClient(config) {
  return new GoogleAdsApi({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    developer_token: config.developerToken,
  });
}

export function createCustomer(config) {
  const customerOptions = {
    customer_id: config.customerId,
    refresh_token: config.refreshToken,
  };

  if (config.loginCustomerId) {
    customerOptions.login_customer_id = config.loginCustomerId;
  }

  return createGoogleAdsClient(config).Customer(customerOptions);
}

export function normalizeCustomerId(value = "") {
  return value.replace(/\D/g, "");
}

export function readField(row, path) {
  if (!row || typeof row !== "object") {
    return undefined;
  }

  if (Object.hasOwn(row, path)) {
    return row[path];
  }

  return path.split(".").reduce((current, key) => {
    if (current && typeof current === "object" && key in current) {
      return current[key];
    }

    return undefined;
  }, row);
}

export function toTextArray(value) {
  if (!value) {
    return [];
  }

  if (!Array.isArray(value)) {
    return [toSingleText(value)].filter(Boolean);
  }

  return value.map((item) => toSingleText(item)).filter(Boolean);
}

function toSingleText(value) {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "object") {
    if (typeof value.text === "string") {
      return value.text.trim();
    }

    if (typeof value.asset_text === "string") {
      return value.asset_text.trim();
    }
  }

  return "";
}

export function tokenize(text) {
  const normalized = normalizeText(text);
  const tokens = normalized
    .split(/[^a-z0-9]+/g)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !STOPWORDS.has(token));

  return [...new Set(tokens)];
}

export function normalizeText(text = "") {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

export function buildReferenceTerms({
  campaignName,
  adGroupName,
  headlines = [],
  descriptions = [],
  keywords = [],
}) {
  const prioritizedTerms = [];

  for (const source of [campaignName, adGroupName, ...headlines, ...descriptions, ...keywords]) {
    prioritizedTerms.push(...tokenize(source));
  }

  return [...new Set(prioritizedTerms)].slice(0, 20);
}

export function evaluateMessageMatch(referenceTerms, pageProfile) {
  const pageTokenSet = new Set(pageProfile.tokens);
  const matchedTerms = referenceTerms.filter((term) => pageTokenSet.has(term));
  const missingTerms = referenceTerms.filter((term) => !pageTokenSet.has(term));
  const score = referenceTerms.length === 0 ? 0 : Math.round((matchedTerms.length / referenceTerms.length) * 100);

  let status = "weak";
  if (score >= 65) {
    status = "strong";
  } else if (score >= 40) {
    status = "review";
  }

  return {
    score,
    status,
    matchedTerms,
    missingTerms,
  };
}

export async function fetchPageProfile(url) {
  const response = await fetch(url, {
    redirect: "follow",
    headers: {
      "user-agent": "UtopiaAnimalAdsAudit/1.0 (+https://utopianimal.org)",
    },
  });

  if (!response.ok) {
    throw new Error(`No se pudo leer ${url}. HTTP ${response.status}`);
  }

  const html = await response.text();
  const bodyText = htmlToText(html);
  const title = extractTagContent(html, "title");
  const metaDescription = extractMetaDescription(html);
  const h1 = extractHeadingContent(html, "h1");
  const h2 = extractHeadingContent(html, "h2");
  const pathname = safePathname(response.url);
  const combinedText = [title, metaDescription, pathname, ...h1, ...h2, bodyText.slice(0, 8000)].join(" ");

  return {
    url: response.url,
    host: new URL(response.url).host.replace(/^www\./, ""),
    pathname,
    title,
    metaDescription,
    h1,
    h2,
    tokens: tokenize(combinedText),
  };
}

export function suggestMainSitePath(referenceTerms) {
  const normalizedTerms = new Set(referenceTerms.map((term) => normalizeText(term)));

  if (hasAny(normalizedTerms, ["adoptar", "adopcion", "adopta"])) {
    return "/refugio/adoptar";
  }

  if (hasAny(normalizedTerms, ["veterinaria", "consulta", "urgencia", "vacunas", "cirugia"])) {
    return "/veterinaria";
  }

  if (hasAny(normalizedTerms, ["donacion", "donar", "apoya", "apoyar"])) {
    return "/apoya";
  }

  if (hasAny(normalizedTerms, ["blog", "guia", "consejos", "bienestar"])) {
    return "/blog";
  }

  return "/refugio";
}

export function buildMainSiteUrl(baseUrl, path) {
  return new URL(path, ensureTrailingSlash(baseUrl)).toString();
}

export function formatMoneyCOP(microsValue) {
  const amount = Number(microsValue || 0) / 1_000_000;

  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function parseAuditArgs(argv) {
  const options = {
    days: 30,
    json: false,
    out: "",
  };

  for (const arg of argv) {
    if (arg === "--json") {
      options.json = true;
      continue;
    }

    if (arg.startsWith("--days=")) {
      const value = Number(arg.split("=")[1]);
      if (!Number.isInteger(value) || value <= 0) {
        throw new Error(`Valor inválido para --days: ${arg}`);
      }
      options.days = value;
      continue;
    }

    if (arg.startsWith("--out=")) {
      options.out = arg.slice("--out=".length).trim();
    }
  }

  return options;
}

export function getDateRange(days) {
  const end = new Date();
  end.setUTCDate(end.getUTCDate() - 1);
  const start = new Date(end);
  start.setUTCDate(end.getUTCDate() - (days - 1));

  return {
    start: formatDate(start),
    end: formatDate(end),
  };
}

export async function writeOutputFile(outputPath, content) {
  const target = new URL(`file://${process.cwd()}/`);
  const fileUrl = new URL(outputPath, target);
  const normalizedPath = decodeURIComponent(fileUrl.pathname);
  const directory = normalizedPath.split("/").slice(0, -1).join("/") || ".";

  await mkdir(directory, { recursive: true });
  await writeFile(normalizedPath, content, "utf8");

  return normalizedPath;
}

function formatDate(date) {
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  const day = `${date.getUTCDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function safePathname(url) {
  try {
    return new URL(url).pathname;
  } catch {
    return "/";
  }
}

function ensureTrailingSlash(url) {
  return url.endsWith("/") ? url : `${url}/`;
}

function htmlToText(html) {
  return decodeHtmlEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function extractTagContent(html, tagName) {
  const match = html.match(new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i"));
  return decodeHtmlEntities(match?.[1] ?? "").replace(/\s+/g, " ").trim();
}

function extractMetaDescription(html) {
  const match = html.match(/<meta\s+[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i);
  return decodeHtmlEntities(match?.[1] ?? "").replace(/\s+/g, " ").trim();
}

function extractHeadingContent(html, headingTag) {
  const pattern = new RegExp(`<${headingTag}[^>]*>([\\s\\S]*?)<\\/${headingTag}>`, "gi");
  const values = [];

  for (const match of html.matchAll(pattern)) {
    const text = decodeHtmlEntities(match[1]).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (text) {
      values.push(text);
    }
  }

  return values.slice(0, 6);
}

function decodeHtmlEntities(value) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&rsquo;/gi, "'")
    .replace(/&ldquo;/gi, '"')
    .replace(/&rdquo;/gi, '"')
    .replace(/&aacute;/gi, "á")
    .replace(/&eacute;/gi, "é")
    .replace(/&iacute;/gi, "í")
    .replace(/&oacute;/gi, "ó")
    .replace(/&uacute;/gi, "ú")
    .replace(/&ntilde;/gi, "ñ");
}

function hasAny(termSet, terms) {
  return terms.some((term) => termSet.has(term));
}
