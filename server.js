const express = require("express");
const { chromium } = require("playwright");

const app = express();
app.use(express.json());

app.post("/scrape", async (req, res) => {
  try {
    const { url } = req.body;

    const browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();

    await page.goto(url, { waitUntil: "domcontentloaded" });

    const title = await page.title();

    await browser.close();

    res.json({ title });

  } catch (err) {
    console.error("ERROR:", err);
    res.status(500).json({ error: "Scraping failed" });
  }
});

app.get("/", (req, res) => {
  res.send("Playwright API is running ✅");
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server started");
});
