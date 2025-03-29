FROM node:16

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

# تثبيت Chromium مع المكتبات الداعمة
RUN apt-get update && apt-get install -y chromium-browser fonts-liberation libasound2

COPY . .

# تحديد المنفذ لاستخدامه مع fly.io
ENV PORT=8080
EXPOSE 8080

CMD ["npm", "start"]
