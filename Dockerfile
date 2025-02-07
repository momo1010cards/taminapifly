FROM node:16

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

# تثبيت Chromium يدويًا
RUN apt-get update && apt-get install -y chromium

COPY . .

CMD ["npm", "start"]
