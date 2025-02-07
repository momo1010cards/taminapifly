const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());

// ✅ حفظ الجلسة في مجلد مناسب لـ Railway
const sessionPath = process.env.SESSION_PATH || path.join(process.env.HOME || process.env.USERPROFILE, '.wwebjs_auth');

// ✅ التحقق مما إذا كانت الجلسة محفوظة مسبقًا
const isSessionSaved = fs.existsSync(sessionPath);

// ✅ إعداد عميل WhatsApp مع ضبط Puppeteer للعمل على Railway
const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: sessionPath
    }),
    puppeteer: {
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome-stable',
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu",
            "--single-process"
        ]
    }
});

// ✅ متغير لتخزين QR Code كصورة
let qrCodeImageUrl = null;

// ✅ توليد QR Code إذا لم تكن الجلسة محفوظة
client.on('qr', async (qr) => {
    if (!isSessionSaved) {
        console.log("✅ QR Code generated. Generating image...");
        qrCodeImageUrl = await qrcode.toDataURL(qr);
        console.log("✅ QR Code image generated. Scan it using your phone.");
    }
});

// ✅ عند نجاح تسجيل الدخول
client.on('ready', () => {
    console.log('✅ WhatsApp Client is ready!');
});

// ✅ API لإرسال رسالة
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

// ✅ API للحصول على QR Code كصورة
app.get('/qrcode', (req, res) => {
    if (!qrCodeImageUrl) {
        return res.status(404).json({ success: false, error: "QR Code not generated yet." });
    }
    res.send(`<img src="${qrCodeImageUrl}" alt="QR Code" />`);
});

// ✅ تشغيل السيرفر على المنفذ الصحيح لـ Railway
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});

// ✅ تهيئة عميل WhatsApp
client.initialize();
