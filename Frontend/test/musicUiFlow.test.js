/* eslint-disable */
const puppeteer = require("puppeteer-core");

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  });
  const page = await browser.newPage();
  await page.goto("http://localhost:5173/music", { waitUntil: "networkidle2" });

  // Simulate delete: find first track's delete button and click
  const deleteButtonSelector = 'button:text("Delete")';
  const deleteButton = await page.$(deleteButtonSelector);
  if (deleteButton) {
    await deleteButton.click();
    await page.waitForTimeout(1000);
    console.log("Delete button clicked.");
  } else {
    console.log("No delete button found.");
  }

  // Simulate upload: go to upload page, fill form, submit
  await page.goto("http://localhost:5173/upload", {
    waitUntil: "networkidle2",
  });
  // You would need to attach a real file here for a true test
  // For now, just check if upload form is present
  const uploadForm = await page.$("form");
  if (uploadForm) {
    console.log("Upload form found.");
  } else {
    console.log("Upload form not found.");
  }

  await browser.close();
})();
