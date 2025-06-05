# Schat Deployment Guide - Step by Step

## Step 1: Create PostgreSQL Database on Render

1. Go to https://render.com and sign in/create an account
2. Click on "New" → "PostgreSQL"
3. Fill in the following details:
   - Name: schat-db
   - Database: schat
   - User: schat_user
   - Region: Choose the closest to you
   - Instance Type: Free (for testing) or other plan based on your needs
4. Click "Create Database"
5. Once created, take note of the "Internal Database URL" displayed - you'll need this in Step 2

## Step 2: Deploy Web Service Using Blueprint

1. In the Render dashboard, click on "New" → "Blueprint"
2. Connect your GitHub account (if not already connected)
3. Select the repository: samsanjay99/Schat
4. Render will detect the render.yaml file and set up services accordingly
5. Set the following environment variables when prompted:
   - DATABASE_URL: [Paste the Internal Database URL from Step 1]
   - SESSION_SECRET: 505ea95c04b383cd985e6551ac2a52962c24f8c5a2357633e0da7a9f0522aea1
   - NODE_ENV: production
   
   If you want to use Cloudinary for file uploads (optional):
   - CLOUDINARY_CLOUD_NAME: [Your Cloudinary cloud name]
   - CLOUDINARY_API_KEY: [Your Cloudinary API key]
   - CLOUDINARY_API_SECRET: [Your Cloudinary API secret]

6. Click "Apply" or "Create Blueprint"
7. Wait for the deployment to complete (this may take a few minutes)

## Step 3: Initialize Database Schema

1. Once your web service is deployed, go to the Web Service details page
2. Click on "Shell" in the top right corner
3. Run the following command to set up the database schema:
   ```
   npm run db:push
   ```
4. Wait for the command to complete

## Step 4: Verify the Deployment

1. Your application will be available at a URL like: https://schat-app.onrender.com
2. Open the URL in your browser
3. Test the application by:
   - Creating a user account
   - Logging in
   - Creating another user account (in another browser/incognito window)
   - Starting a chat between the two accounts
   - Sending messages to verify real-time functionality

## Troubleshooting

If you encounter any issues:

1. Check the logs in the Render dashboard for your web service
2. Verify that all environment variables are set correctly
3. Make sure the database is properly connected
4. If WebSockets aren't working, check that your browser supports them

## Additional Configuration

### Custom Domain
1. In the Render dashboard, go to your web service
2. Click on "Settings" → "Custom Domain"
3. Follow the instructions to add your domain

### Scaling
1. If you need more resources, you can upgrade your service plan in the Render dashboard
2. Go to your web service → "Settings" → "Instance Type"

### Monitoring
1. Render provides basic monitoring in the dashboard
2. For more advanced monitoring, consider adding a service like Sentry

## Security Notes

1. The SESSION_SECRET in this guide is just an example - it's already been exposed in this file
2. For a production deployment, consider generating a new SESSION_SECRET

## Database Backups

Render automatically backs up your PostgreSQL database daily. To access backups:
1. Go to your database in the Render dashboard
2. Click on "Backups" 