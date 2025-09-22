# ---- client build ----
FROM node:24.8.0-bookworm-slim AS client
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client ./
RUN npm run build

# ---- server build ----
FROM node:24.8.0-bookworm-slim AS server
ENV NODE_ENV=production
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . ./
# bring in built SPA
COPY --from=client /app/client/dist ./client/dist

FROM gcr.io/distroless/nodejs22-debian12:nonroot
WORKDIR /app
COPY --from=server /app /app
USER nonroot
EXPOSE 3000
CMD ["./bin/www"]
