FROM node:18-alpine

WORKDIR /app

COPY . .

RUN npm install

WORKDIR /app/backend

CMD ["npm", "run", "worker"]