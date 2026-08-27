# Stage 1: Build Vite React application
FROM node:20-alpine AS builder

WORKDIR /app

# Build arguments for environment variables
ARG VITE_API_BASE_URL=https://we-care-api-es.up.railway.app/api/v1
ARG VITE_ROUTER_BASE=/admin/
ARG VITE_DEV_MOCK_MODE=false

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_ROUTER_BASE=$VITE_ROUTER_BASE \
    VITE_DEV_MOCK_MODE=$VITE_DEV_MOCK_MODE

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Serve with high-performance Nginx Alpine
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
RUN ln -sf /usr/share/nginx/html /usr/share/nginx/html/admin
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
