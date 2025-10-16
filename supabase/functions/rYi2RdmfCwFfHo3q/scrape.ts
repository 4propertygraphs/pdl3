// deno run --allow-net --allow-read --allow-write scraper.ts

import { ensureDir } from "https://deno.land/std@0.203.0/fs/mod.ts";
import { parse } from "https://deno.land/x/html_parser@0.1.3/mod.ts";

// === Konfigurace ===
const BASE_URL = "https://www.daft.ie/property-for-sale/ireland?page=";
const MAX_PAGES = 781;
const CONCURRENCY = 10;
const DELAY_BETWEEN_TASKS = 1500;
const PROXY = "http://spzoitrqkt:seHzVtwS1iNk6~p2u4@gate.decodo.com:7000";

// === Queue helper ===
async function runParallel<T>(items: T[], worker: (item: T) => Promise<void>, concurrency = 10) {
  const queue = [...items];
  const workers = Array.from({ length: concurrency }, async () => {
    while (queue.length) {
      const item = queue.shift();
      if (item) {
        try {
          await worker(item);
        } catch (err) {
          console.error("❌ Worker error:", err.message);
        }
      }
    }
  });
  await Promise.all(workers);
}

// === Proxy Fetch ===
async function proxyFetch(url: string): Promise<string> {
  const proxyUrl = new URL(PROXY);
  const proxyHost = proxyUrl.hostname;
  const proxyPort = parseInt(proxyUrl.port);
  const auth = proxyUrl.username + ":" + proxyUrl.password;

  const conn = await Deno.connect({
    hostname: proxyHost,
    port: proxyPort,
  });

  const connectRequest = `CONNECT ${new URL(url).hostname}:443 HTTP/1.1\r
Host: ${new URL(url).hostname}:443\r
Proxy-Authorization: Basic ${btoa(auth)}\r
\r\n`;
  await conn.write(new TextEncoder().encode(connectRequest));

  const buf = new Uint8Array(4096);
  await conn.read(buf); // ignore response

  const tlsConn = await Deno.startTls(conn, {
    hostname: new URL(url).hostname,
  });

  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
    dispatcher: { fetch: () => tlsConn }, // basic hack
  });

  return await res.text();
}

// === Získání URL z jedné stránky ===
async function getPropertyUrls(page: number): Promise<string[]> {
  const html = await fetch(`${BASE_URL}${page}`, {
    headers: { "User-Agent": "Mozilla/5.0" },
  }).then(res => res.text());

  const urls: string[] = [];
  const matches = html.matchAll(/href="(\/for-sale\/[^"]+\/\d+)"/g);
  for (const match of matches) {
    const fullUrl = `https://www.daft.ie${match[1].split("?")[0]}`;
    if (!urls.includes(fullUrl)) urls.push(fullUrl);
  }

  console.log(`📄 Stránka ${page}: nalezeno ${urls.length} URL`);
  return urls;
}

// === Stažení detailu a konverze ===
async function downloadAndConvert(url: string) {
  const id = url.match(/\/(\d+)(?:\/)?$/)?.[1] ?? crypto.randomUUID();
  const htmlPath = `html/${id}.html`;
  const jsonPath = `json/${id}.json`;

  try {
    const html = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    }).then(res => res.text());

    await Deno.writeTextFile(htmlPath, html);

    // === Konverze ===
    const doc = parse(html);
    const jsonData: Record<string, any> = {};

    const jsonScript = doc.querySelector("#__NEXT_DATA__")?.textContent;
    if (jsonScript) {
      const raw = JSON.parse(jsonScript);
      const listing = raw.props?.pageProps?.listing;
      if (listing) {
        jsonData.id = listing.id;
        jsonData.title = listing.title;
        jsonData.price = listing.price;
        jsonData.numBedrooms = listing.numBedrooms;
        jsonData.numBathrooms = listing.numBathrooms;
        jsonData.propertyType = listing.propertyType;
        jsonData.dateOfConstruction = listing.dateOfConstruction;
        jsonData.description = doc.querySelector("#description-content")?.textContent?.trim();
      }
    }

    await Deno.writeTextFile(jsonPath, JSON.stringify(jsonData, null, 2));
    console.log(`✅ ${id} uložen`);
  } catch (err) {
    console.error(`❌ Chyba u ${url}: ${err.message}`);
  }
}

// === Hlavní běh ===
async function run() {
  await ensureDir("html");
  await ensureDir("json");

  // === 1. Fáze – získej URL
  const pageNumbers = Array.from({ length: MAX_PAGES }, (_, i) => i + 1);
  const allUrls = new Set<string>();

  await runParallel(pageNumbers, async (page) => {
    const urls = await getPropertyUrls(page);
    urls.forEach((u) => allUrls.add(u));
    await new Promise((r) => setTimeout(r, DELAY_BETWEEN_TASKS));
  }, CONCURRENCY);

  // === 2. Fáze – stáhni & konvertuj každý detail
  const urlsList = Array.from(allUrls);
  await runParallel(urlsList, downloadAndConvert, CONCURRENCY);

  console.log("🏁 HOTOVO – vše zpracováno");
}

run();
