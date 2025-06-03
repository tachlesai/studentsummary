FROM node:18.16.1 AS frontend-build

WORKDIR /frontend-build

# Copy package files and .npmrc first for better caching
COPY Student_summary/package*.json ./
COPY Student_summary/.npmrc ./

# Install all dependencies including dev dependencies
RUN npm install

# Copy the rest of the frontend code
COPY Student_summary ./

# Build the frontend
RUN npm run build

FROM node:18.16.1

WORKDIR /app

# Copy server files
COPY server ./server/
COPY package*.json ./

# Install server dependencies
RUN npm install
RUN cd server && npm install

# Setup the pg module compatibility
RUN mkdir -p ./server/node_modules/pg/lib/crypto
COPY server/cert-signatures.js ./server/node_modules/pg/lib/crypto/

# Copy the built frontend from the build stage
COPY --from=frontend-build /frontend-build/dist ./Student_summary/dist

# Start the server
CMD ["node", "server/server.js"] 