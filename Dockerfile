FROM node:18.18.0

# تثبيت Chromium والمتطلبات الأخرى
RUN apt-get update && apt-get install -y \
    chromium \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm-dev \
    libasound2 \
    libpangocairo-1.0-0 \
    libpango-1.0-0 \
    libgtk-3-0 \
    libx11-xcb1 \
    --no-install-recommends && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# تحديد مجلد العمل
WORKDIR /app

# نسخ ملفات الحزم وتثبيت التبعيات
COPY package.json .
COPY package-lock.json .
RUN npm install

# نسخ باقي الملفات
COPY . .

# تشغيل التطبيق
CMD ["npm", "start"]
