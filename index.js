const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());

// مسار حفظ الجلسة
const sessionPath = path.join('/data', '.wwebjs_auth');

// التأكد من وجود المجلد
if (!fs.existsSync(sessionPath)) {
    fs.mkdirSync(sessionPath, { recursive: true });
}

const client = new Client({
    authStrategy: new LocalAuth({
        clientId: "whatsapp-client",
        dataPath: sessionPath
    }),
    puppeteer: {
        headless: true,
        executablePath: '/usr/bin/chromium',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu'
        ]
    }
});

let qrCodeImageUrl = null;

// الصفحة الرئيسية
app.get('/', (req, res) => {
    res.send(`
        <h1>WhatsApp API is Running</h1>
        <p>Status: Active</p>
        <a href="/qrcode">View QR Code</a>
    `);
});

client.on('qr', async (qr) => {
    console.log("✅ QR Code generated");
    qrCodeImageUrl = await qrcode.toDataURL(qr);
});

client.on('authenticated', () => {
    console.log('✅ Client authenticated');
});

client.on('ready', () => {
    console.log('✅ WhatsApp Client is ready!');
});

app.post('/send', async (req, res) => {
    const { phone, message } = req.body;

    if (!phone || !message) {
        return res.status(400).json({ success: false, error: "رقم الهاتف والرسالة مطلوبان!" });
    }

    try {
        await client.sendMessage(`${phone}@c.us`, message);
        res.json({ success: true, message: "✅ تم إرسال الرسالة!" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/qrcode', (req, res) => {
    if (!qrCodeImageUrl) {
        return res.status(404).json({ success: false, error: "QR Code not generated yet." });
    }
    res.send(`
        <html>
            <body style="display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0;">
                <img src="${qrCodeImageUrl}" alt="QR Code" style="max-width: 300px;" />
            </body>
        </html>
    `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});

client.initialize();
