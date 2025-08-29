FROM node:24.7.0-bookworm-slim AS builder
ENV NODE_ENV=production
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .

FROM gcr.io/distroless/nodejs22-debian12:nonroot
WORKDIR /app
COPY --from=builder /app /app
USER nonroot
EXPOSE 3000
CMD ["./bin/www"]
