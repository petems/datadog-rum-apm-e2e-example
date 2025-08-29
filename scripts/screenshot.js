#!/usr/bin/env node

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const logger = require('../logger');

const SCREENSHOT_DIR = path.join(__dirname, '../docs/screenshots');
const README_PATH = path.join(__dirname, '../README.md');

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const screenshots = [
  {
    name: 'homepage',
    url: 'http://localhost:3000',
    description: 'Homepage',
    viewport: { width: 1200, height: 800 },
  },
  {
    name: 'create-page',
    url: 'http://localhost:3000/page',
    description: 'Create New Page',
    viewport: { width: 1200, height: 800 },
  },
  {
    name: 'edit-page',
    url: 'http://localhost:3000/page/1/edit',
    description: 'Edit Page',
    viewport: { width: 1200, height: 800 },
  },
  {
    name: 'error-page',
    url: 'http://localhost:3000/page/999999',
    description: 'Error Page',
    viewport: { width: 1200, height: 800 },
  },
];

async function takeScreenshots() {
  logger.info('🚀 Starting screenshot capture...');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    for (const screenshot of screenshots) {
      logger.info(`📸 Capturing ${screenshot.description}...`);

      const page = await browser.newPage();
      await page.setViewportSize(screenshot.viewport);

      try {
        // Navigate to the page
        await page.goto(screenshot.url, {
          waitUntil: 'networkidle',
          timeout: 10000,
        });

        // Wait a bit for any animations to complete
        await page.waitForTimeout(1000);

        // Take screenshot
        const screenshotPath = path.join(
          SCREENSHOT_DIR,
          `${screenshot.name}.png`
        );
        await page.screenshot({
          path: screenshotPath,
          fullPage: false,
        });

        logger.info(
          `✅ Captured ${screenshot.description} -> ${screenshotPath}`
        );
      } catch (error) {
        logger.error(
          `❌ Failed to capture ${screenshot.description}:`,
          error.message
        );
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }

  logger.info('🎉 Screenshot capture completed!');
}

async function updateReadme() {
  logger.info('📝 Updating README.md...');

  try {
    let readmeContent = fs.readFileSync(README_PATH, 'utf8');

    // Update screenshot section
    const screenshotSection = `### App Screenshots

![Datablog Screenshot](docs/screenshots/homepage.png)

### Trace E2E Screenshot

![RUM and APM Connected Trace](docs/screenshots/rum-and-apm-trace.png)`;

    // Replace the screenshot section in README
    const screenshotRegex =
      /### App Screenshots[\s\S]*?### Trace E2E Screenshot[\s\S]*?\]\(docs\/screenshots\/rum-and-apm-trace\.png\)/;

    if (screenshotRegex.test(readmeContent)) {
      readmeContent = readmeContent.replace(screenshotRegex, screenshotSection);
    } else {
      // If no screenshot section exists, add it to the existing Screenshots section
      const screenshotsIndex = readmeContent.indexOf('## 📸 Screenshots');
      if (screenshotsIndex !== -1) {
        // Find the end of the screenshots section
        const nextSectionIndex = readmeContent.indexOf(
          '## ',
          screenshotsIndex + 1
        );
        const insertIndex =
          nextSectionIndex !== -1 ? nextSectionIndex : readmeContent.length;

        readmeContent = [
          readmeContent.slice(0, insertIndex),
          '',
          screenshotSection,
          '',
          readmeContent.slice(insertIndex),
        ].join('\n');
      } else {
        // Fallback: add before Contributing section
        const contributingIndex = readmeContent.indexOf('## 🤝 Contributing');
        if (contributingIndex !== -1) {
          readmeContent = [
            readmeContent.slice(0, contributingIndex),
            '## 📸 Screenshots',
            '',
            screenshotSection,
            '',
            readmeContent.slice(contributingIndex),
          ].join('\n');
        }
      }
    }

    fs.writeFileSync(README_PATH, readmeContent);
    logger.info('✅ README.md updated successfully!');
  } catch (error) {
    logger.error('❌ Failed to update README.md:', error.message);
  }
}

async function main() {
  try {
    // Check if the application is running
    const http = require('http');
    const checkApp = () => {
      return new Promise(resolve => {
        const req = http.get('http://localhost:3000', res => {
          resolve(res.statusCode === 200);
        });
        req.on('error', () => resolve(false));
        req.setTimeout(5000, () => {
          req.destroy();
          resolve(false);
        });
      });
    };

    const isAppRunning = await checkApp();
    if (!isAppRunning) {
      logger.warn('⚠️  Application is not running on http://localhost:3000');
      logger.info('💡 Please start the application first:');
      logger.info('   npm start');
      logger.info('   or');
      logger.info('   docker-compose up -d');
      process.exit(1);
    }

    await takeScreenshots();
    await updateReadme();

    logger.info('🎊 All done! Screenshots captured and README updated.');
  } catch (error) {
    logger.error('💥 Error:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { takeScreenshots, updateReadme };
