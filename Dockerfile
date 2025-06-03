FROM node:18.16.1 AS frontend-build

WORKDIR /frontend-build
COPY Student_summary/package*.json ./
RUN npm install --production=false

COPY Student_summary ./
RUN npm run build

FROM node:18.16.1

WORKDIR /app

# Copy server files
COPY server ./server/
COPY package*.json ./

# Install server dependencies
RUN npm install --production=false
RUN cd server && npm install --production=false

# Setup the pg module compatibility
RUN mkdir -p ./server/node_modules/pg/lib/crypto
COPY server/cert-signatures.js ./server/node_modules/pg/lib/crypto/

# Copy the built frontend from the build stage
COPY --from=frontend-build /frontend-build/dist ./Student_summary/dist

# Start the server
CMD ["node", "server/server.js"] 