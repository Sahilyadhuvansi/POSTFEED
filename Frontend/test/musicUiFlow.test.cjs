const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Pipe page console to node console for debugging
  page.on("console", (msg) => {
    try {
      console.log("PAGE_CONSOLE:", msg.text());
    } catch (e) {}
  });
  page.on("pageerror", (err) => {
    console.error("PAGE_ERROR:", err.toString());
  });

  // Login first
  await page.goto("http://localhost:5003/login", { waitUntil: "networkidle2" });
  // dump HTML for debugging
  const html = await page.content();
  console.log("PAGE_HTML_START\n", html.slice(0, 3000), "\nPAGE_HTML_END");
  await page.waitForSelector('input[name="identifier"]', { timeout: 5000 });
  await page.type('input[name="identifier"]', "testuser");
  await page.type('input[name="password"]', "testpass");
  await page.click('button[type="submit"]');
  await page
    .waitForNavigation({ waitUntil: "networkidle2", timeout: 10000 })
    .catch(() => {});

  // Now go to music page
  await page.goto("http://localhost:5003/music", { waitUntil: "networkidle2" });

  // Simulate delete: find first track's menu button, open menu, then click delete
  await page
    .waitForSelector('button[aria-label="Track options"]', { timeout: 5000 })
    .catch(() => {});
  const menuButton = await page.$('button[aria-label="Track options"]');
  if (menuButton) {
    await menuButton.click();
    await page.waitForTimeout(500);
    const deleteButton = await page.$x("//button[.//span[text()='Delete']]");
    if (deleteButton.length > 0) {
      await page.evaluate(() => {
        window.confirm = () => true;
      });
      await deleteButton[0].click();
      await page.waitForTimeout(1000);
      console.log("Delete button clicked.");
    } else {
      console.log("Delete button not found in dropdown.");
    }
  } else {
    console.log("No menu button found.");
  }

  // Simulate upload: go to upload page, fill form, submit
  await page.goto("http://localhost:5003/upload", {
    waitUntil: "networkidle2",
  });
  await page
    .waitForSelector("input#upload-audio", { timeout: 5000 })
    .catch(() => {});
  const audioInput = await page.$("input#upload-audio");
  if (audioInput) {
    console.log("Audio input found.");
  } else {
    console.log("Audio input not found.");
  }
  await page
    .waitForSelector('button[type="submit"]', { timeout: 5000 })
    .catch(() => {});
  const submitButton = await page.$('button[type="submit"]');
  if (submitButton) {
    console.log("Submit button found.");
  } else {
    console.log("Submit button not found.");
  }

  await browser.close();
})();
