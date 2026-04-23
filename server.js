const express = require("express");
const { chromium } = require("playwright");

const app = express();
app.use(express.json());

app.post("/scrape", async (req, res) => {
  let browser;
  try {
    const { url, selector } = req.body;

    if (!url) {
      return res.status(400).json({ error: "url is required" });
    }

    browser = await chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-blink-features=AutomationControlled",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--single-process",        // Important for Render's free tier memory limits
        "--no-zygote"
      ]
    });

    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      viewport: { width: 1280, height: 800 },
      locale: "en-GB",
      extraHTTPHeaders: {
        "Accept-Language": "en-GB,en;q=0.9"
      }
    });

    const page = await context.newPage();

    // Hide webdriver flag (basic anti-bot evasion)
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => undefined });
    });

    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 30000
    });

    // Wait a moment for JS-rendered content
    await page.waitForTimeout(2000);

    const title = await page.title();

    // If a CSS selector is provided, extract matching elements' text
    let items = [];
    if (selector) {
      items = await page.$$eval(selector, (els) =>
        els.map((el) => el.innerText.trim()).filter(Boolean)
      );
    }

    // Always return the full HTML so you can inspect/parse it downstream (e.g. in n8n)
    const html = await page.content();

    await browser.close();

    res.json({ title, items, html });

  } catch (err) {
    if (browser) await browser.close().catch(() => {});
    console.error("ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get("/", (req, res) => {
  res.send("Playwright API is running ✅");
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server started on port", process.env.PORT || 3000);
});
