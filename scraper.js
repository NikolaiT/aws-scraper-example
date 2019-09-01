'use strict';

async function intercept(page) {
    await page.setRequestInterception(true);
    page.on('request', (req) => {
        let type = req.resourceType();
        const block = ['image', 'media']; // ['stylesheet', 'font', 'image', 'media'];
        if (block.includes(type)) {
            req.abort();
        } else {
            req.continue();
        }
    });
}

async function random_sleep(page) {
    const [min, max] = [3000, 12000];
    let rand = Math.floor(Math.random() * (max - min + 1) + min); //Generate Random interval
    console.log('sleeping for ' + rand);
    await page.waitFor(rand);
}

async function googleSearch(page, name) {
    await page.goto('https://www.google.com/webhp?num=100');
    await page.waitForSelector('#main');
    let selector = '[name="q"]';
    await page.waitFor(selector);
    const input = await page.$('input[name="q"]');
    await page.evaluate((value, selector) => {
        document.querySelector(selector).value = '';
        document.querySelector(selector).value = value;
    }, name, selector);
    await input.focus();
    await page.keyboard.press("Enter");
    await page.waitForSelector('.g .r');
    await page.waitFor(500);

    return await page.evaluate(() => {
        let links = document.querySelectorAll('.g .r a');
        let data = [];
        links.forEach((node) => {
            if (node) {
                data.push(node.getAttribute('href'));
            }
        });
        return data;
    });
}

exports.handler = async (event, context) => {
    const UserAgent = require('user-agents');
    const chromium = require('chrome-aws-lambda');

    let results = null;
    let browser = null;

    try {
        const userAgent = new UserAgent({ deviceCategory: 'desktop' }).toString();
        chromium.args.push(`--user-agent=${userAgent}`);

        console.dir(chromium.args, null, true);

        browser = await chromium.puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath,
            headless: chromium.headless,
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 1900, height: 1024 });
        await intercept(page);

        if (event.keyword) {
            results = await googleSearch(page, event.keyword);
        }

    } catch (error) {
        return context.fail(error);
    } finally {
        if (browser !== null) {
            await browser.close();
        }
    }
    
    return JSON.stringify(results);
};

