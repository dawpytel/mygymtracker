FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

# Make startup script executable
COPY scripts/start-production.sh ./
RUN chmod +x start-production.sh

EXPOSE 3000

CMD ["./start-production.sh"]