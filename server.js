const express = require('express');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// ملف لحفظ حالة الجلسة
const SESSION_FILE = 'session.json';

// Middleware لتحليل JSON
app.use(express.json());

// نقطة نهاية API لإرسال الرسائل
app.post('/send-message', async (req, res) => {
    const { phone, message } = req.body;

    if (!phone || !message) {
        return res.status(400).json({ success: false, error: 'Phone and message are required.' });
    }

    try {
        // إرسال الرسالة
        await sendWhatsAppMessage(phone, message);
        res.json({ success: true, message: 'Message sent successfully!' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// وظيفة لإرسال الرسالة عبر واتساب ويب
async function sendWhatsAppMessage(phone, message) {
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: true, // التشغيل في الخلفية
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();

        // تحميل حالة الجلسة إذا كانت موجودة
        if (fs.existsSync(SESSION_FILE)) {
            const sessionData = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8'));
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
            await page.setCookie(...sessionData.cookies);
            await page.goto('https://web.whatsapp.com');
        } else {
            await page.goto('https://web.whatsapp.com');
            console.log('الرجاء مسح QR code يدويًا...');
            await page.waitForSelector('._2Uo0Z', { visible: true, timeout: 0 });

            // حفظ حالة الجلسة
            const cookies = await page.cookies();
            fs.writeFileSync(SESSION_FILE, JSON.stringify({ cookies }));
        }

        // الانتقال إلى الدردشة مع الرقم المحدد
        await page.goto(`https://web.whatsapp.com/send?phone=${phone}`);

        // انتظر حتى يتم تحميل مربع الرسالة
        await page.waitForSelector('._13NKt', { visible: true });

        // اكتب الرسالة
        await page.type('._13NKt', message);

        // اضغط على زر الإرسال
        await page.keyboard.press('Enter');

        console.log('تم إرسال الرسالة بنجاح!');
    } catch (error) {
        console.error('فشل إرسال الرسالة:', error);
        throw error;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// تشغيل الخادم
app.listen(port, () => {
    console.log(`الخادم يعمل على http://localhost:${port}`);
});
