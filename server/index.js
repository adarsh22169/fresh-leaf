import express, { json, urlencoded } from 'express';
import { join } from 'path';
import puppeteer from 'puppeteer';
import fs from 'fs';
import cors from 'cors';
import { promisify } from 'util';

const currentDir = process.cwd();
const app = express();
const port = 3000;

app.use(cors());
app.use(json());
app.use(urlencoded({ extended: true }));

const downloadsDir = join(currentDir, 'downloads');
if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir);
}

// Initialize Puppeteer outside the request handler
let browser;
let page;

const initPuppeteer = async () => {
    browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-infobars',
            '--disable-dev-shm-usage',
            '--window-size=1920,1080',
        ],
    });
    page = await browser.newPage();
    const client = await page.target().createCDPSession();
    await client.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: downloadsDir });
};

// Call the function to initialize Puppeteer when the server starts
initPuppeteer().catch(console.error);

app.get('/',async( req,res)=>{
    res.sendStatus(200);
})
    

app.post('/download-resume', async (req, res) => {
    const url = req.body.url;
    console.log('received url', url);

    try {
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('a[aria-label="Download PDF"][download]', { timeout: 20000 });
        console.log('Download button found');

        // Click the download button
        await new Promise(resolve => setTimeout(resolve, 5000));
        await page.click('a[aria-label="Download PDF"][download]');

        // Wait for the download to complete
        console.log('Waiting for download to complete...');
        
        // Wait for a file to appear in the downloads directory
        let fileName;
        while (!fileName) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second
            const files = fs.readdirSync(downloadsDir);
            fileName = files.find(file => file.endsWith('.pdf'));
        }

        console.log('Download completed');
        const filePath = join(downloadsDir, fileName);

        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Type', 'application/pdf');

        // Send the file
        res.sendFile(filePath, async (err) => {
            if (err) {
                console.error('Error sending file:', err);
                res.status(err.status || 500).send('Failed to send the file');
            } else {
                console.log('File sent successfully');
                
                // Delete the file after sending
                try {
                    await promisify(fs.unlink)(filePath);
                    console.log('File deleted successfully');
                } catch (deleteError) {
                    console.error('Error deleting file:', deleteError);
                }
            }
        });
    } catch (error) {
        console.error('Error downloading or sending resume:', error);
        res.status(500).json({ error: 'Failed to download or send resume' });
    }
});

app.get('/read/:id', async (req, res) => {
    let url = req.params.id;
    console.log('received url', url);
    url = 'https://www.overleaf.com/read/'+ url
    console.log('modified url',url)

    try {
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('a[aria-label="Download PDF"][download]', { timeout: 20000 });
        console.log('Download button found');

        // Click the download button
        await new Promise(resolve => setTimeout(resolve, 5000));
        await page.click('a[aria-label="Download PDF"][download]');

        // Wait for the download to complete
        console.log('Waiting for download to complete...');
        
        // Wait for a file to appear in the downloads directory
        let fileName;
        while (!fileName) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second
            const files = fs.readdirSync(downloadsDir);
            fileName = files.find(file => file.endsWith('.pdf'));
        }

        console.log('Download completed');
        const filePath = join(downloadsDir, fileName);

        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Type', 'application/pdf');

        // Send the file
        res.sendFile(filePath, async (err) => {
            if (err) {
                console.error('Error sending file:', err);
                res.status(err.status || 500).send('Failed to send the file');
            } else {
                console.log('File sent successfully');
                
                // Delete the file after sending
                try {
                    await promisify(fs.unlink)(filePath);
                    console.log('File deleted successfully');
                } catch (deleteError) {
                    console.error('Error deleting file:', deleteError);
                }
            }
        });
    } catch (error) {
        console.error('Error downloading or sending resume:', error);
        res.status(500).json({ error: 'Failed to download or send resume' });
    }
});

// Handle server shutdown gracefully
const shutdown = async () => {
    if (browser) {
        await browser.close();
    }
    process.exit();
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});