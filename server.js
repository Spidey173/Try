const express = require("express");
const { chromium } = require("playwright");
const { execSync } = require("child_process");

const app = express();
app.use(express.json());

// 🔥 Ensure browser is installed
try {
  execSync("npx playwright install chromium", { stdio: "inherit" });
} catch (e) {
  console.log("Browser install skipped");
}

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
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/", (req, res) => {
  res.send("Playwright API is running ✅");
});

app.listen(process.env.PORT || 3000);
