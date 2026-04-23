const express = require("express");
const { chromium } = require("playwright");

const app = express();
app.use(express.json());

app.post("/scrape", async (req, res) => {
  const { url } = req.body;

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(url, { waitUntil: "domcontentloaded" });

  const title = await page.title();

  await browser.close();

  res.json({ title });
});

app.listen(process.env.PORT || 3000);