const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());

// إعداد عميل WhatsApp مع LocalAuth لحفظ الجلسة
const client = new Client({
    authStrategy: new LocalAuth(), // يحفظ الجلسة تلقائيًا
    puppeteer: {
        headless: true,
        executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium-browser', // التأكد من مسار Chromium
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

// متغير لتخزين QR Code
let qrCodeImageUrl = null;

// توليد QR Code عند الحاجة فقط
client.on('qr', async (qr) => {
    console.log("✅ QR Code generated. Generating image...");
    qrCodeImageUrl = await qrcode.toDataURL(qr);
    console.log("✅ Scan this QR Code:", qrCodeImageUrl);
});

// التأكد من أن العميل جاهز
client.on('ready', () => {
    console.log('✅ WhatsApp Client is ready!');
});

// التحقق من حالات الاتصال
client.on('disconnected', (reason) => {
    console.error('⚠️ Client disconnected:', reason);
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

// API للحصول على QR Code
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
