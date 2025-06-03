FROM node:18.16.1

WORKDIR /app

# Copy the entire project
COPY . .

# Install dependencies and build frontend
RUN npm install --production=false
RUN cd server && npm install --production=false
RUN cd Student_summary && npm install --production=false && npm run build

# Setup the pg module compatibility
RUN mkdir -p ./server/node_modules/pg/lib/crypto
COPY server/cert-signatures.js ./server/node_modules/pg/lib/crypto/

# Start the server
CMD ["node", "server/server.js"] 