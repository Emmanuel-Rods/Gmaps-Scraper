const puppeteerExtra = require("puppeteer-extra");
const Stealth = require("puppeteer-extra-plugin-stealth");
const fs = require("fs");
const xlsx = require("xlsx");
const path = require("path");

puppeteerExtra.use(Stealth());

const disableFilters = false;

const categories = ["scaffolding hire"];

const cities = ["London"];

async function scraper(business, place) {
  createFolder(place); //changed from business to place

  const query = queryBuilder(business + " in " + place);
  const browserObj = await puppeteerExtra.launch({ headless: true });
  const page = await browserObj.newPage();

  await page.setViewport({ width: 1920, height: 1080 });

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
  );

  await page.goto(`https://www.google.com/maps/search/${query}`);

  function delay(time) {
    return new Promise((resolve) => {
      setTimeout(resolve, time);
    });
  }
  const scrollableElement = await page.$(
    ".m6QErb.DxyBCb.kA9KIf.dS8AEf.XiKgde.ecceSd[role='feed']"
  );
  while (
    (await scrollableElement.$("p.fontBodyMedium > span > span.HlvSq")) == null
  ) {
    await page.evaluate((el) => el.scrollBy(0, 200), scrollableElement);
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  const gBusinsessLink = await page.$$(`a.hfpxzc`);

  const data = [];

  for (const link of gBusinsessLink) {
    const href = await link.evaluate((el) => el.href);
    console.log(`Opening link: ${href}`);

    try {

      const newPage = await page.browser().newPage();
      await newPage.goto(href, { waitUntil: "domcontentloaded" });

  
      const name = await newPage.evaluate(() => {
        const element = document.querySelector("h1.DUwDvf.lfPIob");
        return element ? element.textContent.trim() : null;
      });
    
      const category = await newPage.evaluate(() => {
        const categoryButton = document.querySelector(
          'button[jsaction^="pane."][jsaction$=".category"]'
        );
        return categoryButton ? categoryButton.textContent.trim() : null;
      });

      const addressElements = await newPage.evaluate(() => {
        const elements = Array.from(
          document.querySelectorAll("div.Io6YTe.fontBodyMedium.kR99db.fdkmkc")
        );
        return elements.map((el) => el.textContent);
      });

      const address = addressElements[0] || null;

      function isPhoneNumber(text) {
        return /\+?\d{1,4}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/.test(
          text
        );
      }

      let phoneNumber = null;
      for (let i = 1; i < addressElements.length; i++) {
        if (isPhoneNumber(addressElements[i])) {
          phoneNumber = addressElements[i];
          break;
        }
      }

      const website = await newPage.evaluate(() => {
        const element = document.querySelector(
          'a[data-tooltip="Open website"]'
        );
        return element ? element.href : null;
      });

      await newPage.close();

      if (disableFilters) {
        data.push({
          name,
          website,
          phoneNumber,
          category,
          address,
        });
      } else {
        if (
          (website !== null || phoneNumber !== null) &&
          (address.includes(place) ||
            name.includes(place) ||
            (website && website.includes(place.toLowerCase())))
        ) {
          if (phoneNumber && !phoneNumber.startsWith("+44 7")) {
            phoneNumber = null;
          }

          // Push the data
          data.push({
            name,
            website,
            phoneNumber,
            category,
            address,
          });
        }
      }
    } catch (error) {
      console.error(`Error processing link ${href}:`, error);
    }
  }
  if (data.length > 0) {
    saveDataToExcel(data, place, `${business}-in-${place}.xlsx`); //changed to to place folder
  } else {
    console.log(`${business} in ${place} has no data`);
  }

  await page.waitForNetworkIdle();

  await page.screenshot({ path: "screenshot.png" });

  //close the browser
  if (runScraper) {
    await browserObj.close();
  }
}

function queryBuilder(text) {
  return text.split(" ").join("+");
}

function createFolder(name) {
  const folderPath = path.join(__dirname, "excelFiles", name);

  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true }); 
    console.log(`Folder '${name}' created at ${folderPath}`);
  }

  return folderPath; 
}

//  to save business data to Excel
function saveDataToExcel(data, folderName, fileName) {
  const folderPath = createFolder(folderName);

  if (!folderPath || typeof folderPath !== "string") {
    console.error("Invalid folder path:", folderPath);
    return;
  }

  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.json_to_sheet(data);

  xlsx.utils.book_append_sheet(wb, ws, "Business Data");

  const filePath = path.join(folderPath, fileName);

  if (!filePath || typeof filePath !== "string") {
    console.error("Invalid file path:", filePath);
    return;
  }
  try {
    xlsx.writeFile(wb, filePath);
    console.log(`Data has been saved to ${filePath}`);
  } catch (error) {
    console.error("Error writing file:", error);
  }
}

async function runScraper() {

  for (
    let categoryIndex = 0;
    categoryIndex < categories.length;
    categoryIndex++
  ) {
    const category = categories[categoryIndex];

    for (let cityIndex = 0; cityIndex < cities.length; cityIndex++) {
      const city = cities[cityIndex];

      // Run the scraper for the current category and city
      try {
        console.log(`Scraping data for category: ${category}, city: ${city}`);
        await scraper(category, city); 
      } catch (error) {
        console.error(`Error scraping ${category} in ${city}:`, error);
      }
    }
  }

  console.log("Scraping complete!");
  return true;
}

runScraper();

