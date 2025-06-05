# Schat Netlify Deployment Guide

This guide will help you deploy the Schat application to Netlify, including setting up the database and configuring the necessary environment variables.

## Prerequisites

1. A Netlify account
2. A PostgreSQL database (Neon, Supabase, etc.)
3. Cloudinary account (optional, for image uploads)

## Step 1: Set Up PostgreSQL Database

Since Netlify doesn't provide a built-in PostgreSQL database, you'll need to use an external service:

### Option A: Neon Database (Recommended)
1. Go to https://neon.tech and create an account
2. Create a new project
3. Create a new database
4. Get your connection string from the dashboard

### Option B: Supabase
1. Go to https://supabase.com and create an account
2. Create a new project
3. Get your PostgreSQL connection string from the dashboard

### Option C: Railway
1. Go to https://railway.app and create an account
2. Create a new project with a PostgreSQL database
3. Get your connection string from the dashboard

## Step 2: Set Up Environment Variables

Before deploying, you'll need to set up these environment variables in your Netlify dashboard:

1. `DATABASE_URL`: Your PostgreSQL connection string
2. `SESSION_SECRET`: A secure random string (e.g., 505ea95c04b383cd985e6551ac2a52962c24f8c5a2357633e0da7a9f0522aea1)
3. `NODE_ENV`: production

If you're using Cloudinary (optional):
4. `CLOUDINARY_CLOUD_NAME`: Your Cloudinary cloud name
5. `CLOUDINARY_API_KEY`: Your Cloudinary API key
6. `CLOUDINARY_API_SECRET`: Your Cloudinary API secret

## Step 3: Deploy to Netlify

### Method 1: Deploy via Netlify CLI

1. Make sure you're logged in to Netlify CLI:
   ```
   netlify login
   ```

2. Initialize Netlify in your project:
   ```
   netlify init
   ```

3. Choose "Create & configure a new site"

4. Follow the prompts to set up your site

5. Deploy the site:
   ```
   netlify deploy --prod
   ```

### Method 2: Deploy via Netlify Dashboard

1. Go to https://app.netlify.com/
2. Click "New site from Git"
3. Connect to your GitHub repository
4. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist/public`
5. Click "Deploy site"

## Step 4: Configure Environment Variables in Netlify Dashboard

1. Go to your site in the Netlify dashboard
2. Click "Site settings" → "Environment variables"
3. Add all the environment variables listed in Step 2

## Step 5: Initialize Database Schema

After deployment, you need to set up the database schema:

1. Go to your site in the Netlify dashboard
2. Click "Functions" → "Console"
3. Run the following command to set up the database schema:
   ```
   npm run db:push
   ```

## Step 6: Verify Deployment

1. Your application will be available at the Netlify URL provided (e.g., https://your-site-name.netlify.app)
2. Test the application by:
   - Creating a user account
   - Logging in
   - Creating another user account (in another browser/incognito window)
   - Starting a chat between the two accounts
   - Sending messages to verify real-time functionality

## Important Notes for Netlify Deployment

### WebSockets Support
Netlify Functions have some limitations with WebSockets. If you experience issues with real-time features:

1. Consider upgrading to Netlify's Edge Functions
2. Or, host the WebSocket server separately on a service like Heroku, Railway, or Render

### Database Connection
Make sure your database allows connections from Netlify's IP ranges. Most cloud database providers have this configured by default.

### Custom Domain
1. In the Netlify dashboard, go to your site
2. Click "Domain settings" → "Add custom domain"
3. Follow the instructions to set up your domain

## Troubleshooting

If you encounter issues:

1. Check the Netlify function logs in the dashboard
2. Verify that your environment variables are set correctly
3. Make sure your database is accessible from Netlify
4. For WebSocket issues, check the network tab in your browser's developer tools

## Monitoring and Scaling

1. Netlify provides basic analytics in the dashboard
2. For more advanced monitoring, consider integrating services like Sentry
3. If you need more resources for your functions, consider upgrading your Netlify plan 