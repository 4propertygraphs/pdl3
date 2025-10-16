// === Daft.ie scraper with parallel fetching, HTML saving and JSON conversion ===
import fetch from "node-fetch";
import * as cheerio from "cheerio";
import fs from "fs/promises";
import path from "path";
import { HttpsProxyAgent } from "https-proxy-agent";
import pLimit from "p-limit";

// === Proxy konfigurace ===
const proxy = "http://spzoitrqkt:seHzVtwS1iNk6~p2u4@gate.decodo.com:7000";
const agent = new HttpsProxyAgent(proxy);

// === Konfigurace ===
const BASE_URL = "https://www.daft.ie/property-for-sale/ireland?page=";
const MAX_PAGES = 781;
const CONCURRENCY = 10;
const LONG_DELAY_EVERY = 20;
const LONG_DELAY_MS = 20000;
const DELAY_BETWEEN_BATCHES = 500;

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

// === Pomocná funkce pro vytvoření složek ===
async function ensureDirs() {
  await fs.mkdir("html", { recursive: true });
  await fs.mkdir("json", { recursive: true });
}

// === Získání URL z výsledkové stránky ===
async function extractPropertyUrls(pageNum) {
  const url = `${BASE_URL}${pageNum}`;
  const res = await fetch(url, { agent, headers: { "User-Agent": "Mozilla/5.0" } });
  const html = await res.text();
  const $ = cheerio.load(html);

  const urls = new Set();
  $("a[href*='/for-sale/']").each((_, el) => {
    const href = $(el).attr("href");
    if (href && href.includes("/for-sale/")) {
      const fullUrl = href.startsWith("http") ? href : `https://www.daft.ie${href}`;
      if (fullUrl.match(/\/\d+$/)) urls.add(fullUrl.split("?")[0]);
    }
  });

  return [...urls];
}

// === Uloží HTML a převede do JSON ===
async function processProperty(url) {
  const match = url.match(/\/(\d+)(?:\/)?$/);
  const id = match ? match[1] : Date.now();
  const htmlPath = `html/${id}.html`;
  const jsonPath = `json/${id}.json`;

  try {
    const res = await fetch(url, { agent, headers: { "User-Agent": "Mozilla/5.0" } });
    const html = await res.text();
    await fs.writeFile(htmlPath, html);

    // === Vytáhni JSON z HTML ===
    const $ = cheerio.load(html);
    const scriptTag = $("script#__NEXT_DATA__").html();
    const jsonData = JSON.parse(scriptTag || "{}");
    const props = jsonData.props?.pageProps?.listing ?? {};

    const extracted = {
      url,
      address: props.address,
      eircode: props.eircode,
      price: props.price,
      currency: props.currency,
      property_type: props.propertyType,
      beds: props.bedrooms,
      baths: props.bathrooms,
      description: props.shortDescription,
      full_description: props.description,
      agency: props?.agency?.name,
      latitude: props?.berDetails?.geo?.lat,
      longitude: props?.berDetails?.geo?.lng,
      ber: props?.berDetails?.rating,
      image_urls: props.media?.images?.map((img) => img.url) ?? [],
    };

    await fs.writeFile(jsonPath, JSON.stringify(extracted, null, 2));
    console.log(`✅ ${id} uložen`);
  } catch (err) {
    console.error(`❌ Chyba u ${url}: ${err.message}`);
  }
}

// === Hlavní funkce ===
async function run() {
  await ensureDirs();
  let allUrls = new Set();

  for (let i = 1; i <= MAX_PAGES; i++) {
    try {
      const urls = await extractPropertyUrls(i);
      urls.forEach((u) => allUrls.add(u));

      console.log(`📄 Stránka ${i}: ${urls.length} URL | Celkem: ${allUrls.size}`);

      if (i % LONG_DELAY_EVERY === 0) {
        console.log("⏸ Pauza 20s");
        await sleep(LONG_DELAY_MS);
      } else {
        await sleep(250);
      }
    } catch (err) {
      console.error(`⚠️ Chyba na stránce ${i}: ${err.message}`);
    }
  }

  // === Paralelní stahování a zpracování ===
  const limit = pLimit(CONCURRENCY);
  const tasks = [...allUrls].map((url) => limit(() => processProperty(url)));
  await Promise.all(tasks);

  console.log("🏁 Hotovo – všechny data staženy a převedeny.");
}

run();
