FROM node:16-bullseye

WORKDIR /app

# تثبيت تبعيات النظام المطلوبة لـ Puppeteer
RUN apt-get update && \
    apt-get install -y \
    chromium \
    fonts-freefont-ttf \
    libxss1 \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

# تعيين متغيرات البيئة لـ Puppeteer
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

COPY package.json package-lock.json ./
RUN npm install

COPY . .

CMD ["npm", "start"]
