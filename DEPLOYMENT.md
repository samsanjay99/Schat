# Schat Deployment Guide

This document provides instructions for deploying the Schat application to various platforms.

## Prerequisites

Before deploying, make sure you have:

1. A PostgreSQL database (such as Neon, Supabase, or any PostgreSQL provider)
2. A Cloudinary account (for image uploads)
3. Your environment variables ready

## Environment Variables

You'll need to set these environment variables:

- `DATABASE_URL`: Your PostgreSQL connection string
- `SESSION_SECRET`: A secure random string for session encryption
- `CLOUDINARY_CLOUD_NAME`: Your Cloudinary cloud name
- `CLOUDINARY_API_KEY`: Your Cloudinary API key
- `CLOUDINARY_API_SECRET`: Your Cloudinary API secret

## Deployment Options

### Option 1: Deploy to Render

1. Create a Render account at https://render.com
2. Create a new Web Service and connect your GitHub repository
3. Use the following settings:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
4. Add your environment variables in the Render dashboard

### Option 2: Deploy to Netlify

1. Create a Netlify account at https://netlify.com
2. Install Netlify CLI: `npm install -g netlify-cli`
3. Login to Netlify: `netlify login`
4. Initialize the project: `netlify init`
5. Deploy the project: `netlify deploy --prod`
6. Set up your environment variables in the Netlify dashboard

### Option 3: Deploy to Railway

1. Create a Railway account at https://railway.app
2. Install Railway CLI: `npm install -g @railway/cli`
3. Login to Railway: `railway login`
4. Initialize the project: `railway init`
5. Deploy the project: `railway up`
6. Set up your environment variables in the Railway dashboard

## Database Setup

Make sure your database is properly initialized. If you're using a fresh database, you may need to run migrations:

```
npm run db:push
```

## Testing Your Deployment

After deployment, verify:

1. User registration and login work correctly
2. Real-time messaging functionality works
3. User search works
4. Image uploads work (if configured)

If you encounter any issues, check the logs in your deployment platform's dashboard. 