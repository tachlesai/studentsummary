# TachlesAI

This is a web application that provides audio transcription and summarization services.

## Local Development

To run the project locally:

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   cd server && npm install
   cd ../Student_summary && npm install
   ```

3. Set up your local PostgreSQL database
   - Create a database named "StudentSummary"
   - Update credentials in `server/.env`

4. Start the server:
   ```
   npm run dev
   ```
   
5. In a separate terminal, start the frontend:
   ```
   cd Student_summary
   npm run dev
   ```

## Deployment to Render

This project includes configuration for easy deployment to Render.com:

1. Push your changes to GitHub
2. In Render dashboard, create a new Web Service
3. Connect to your GitHub repository
4. Use the following settings:
   - Name: tachlesai (or your preferred name)
   - Environment: Node
   - Build Command: `npm run build`
   - Start Command: `npm start`

5. Add required environment variables:
   - `NODE_ENV`: production
   - `SSL_ENABLED`: true
   - `DATABASE_URL`: (Your PostgreSQL connection URL from Render)
   - `JWT_SECRET`: (A secure random string)
   - `GEMINI_API_KEY`: (Your API key)
   - `DEEPGRAM_API_KEY`: (Your API key)

6. Deploy the service

## Working with Different Environments

- **Development**: Uses local database and localhost URLs
- **Production**: Uses PostgreSQL with SSL and relative API URLs

You can switch between environments by changing `NODE_ENV` in `server/.env`.
