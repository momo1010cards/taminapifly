const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());

// إعداد عميل WhatsApp
const client = new Client({
    puppeteer: {
        headless: true,
        executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium-browser',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

// متغير لتخزين QR Code كصورة
let qrCodeImageUrl = null;

// توليد QR Code كصورة
client.on('qr', async (qr) => {
    console.log("✅ QR Code generated. Generating image...");

    // إنشاء QR Code كصورة
    const qrCodeImage = await qrcode.toDataURL(qr);
    qrCodeImageUrl = qrCodeImage;

    console.log("✅ QR Code image generated. Use the following URL to scan:");
    console.log(qrCodeImageUrl); // هذا هو رابط الصورة
});

client.on('ready', () => {
    console.log('✅ WhatsApp Client is ready!');
});

client.initialize().catch(err => {
    console.error('❌ Failed to initialize WhatsApp client:', err);
});

// API لإرسال رسالة
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

// API للحصول على QR Code كصورة
app.get('/qrcode', (req, res) => {
    if (!qrCodeImageUrl) {
        return res.status(404).json({ success: false, error: "QR Code not generated yet." });
    }
    res.send(`<img src="${qrCodeImageUrl}" alt="QR Code" />`);
});

// تشغيل السيرفر
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});

// تهيئة العميل
client.initialize().catch(err => {
    console.error('❌ Failed to initialize WhatsApp client:', err);
});
