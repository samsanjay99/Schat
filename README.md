# Schat - Real-time Chat Application

## Overview

Schat is a WhatsApp-inspired real-time chat application built with a modern full-stack architecture. Users can create accounts with unique IDs (SCHAT_XXXXXX), search for other users, and engage in one-on-one conversations with real-time messaging capabilities.

## Features

- User registration and authentication
- Unique SCHAT_XXXXXX IDs for each user
- Real-time messaging
- User search functionality
- Online/offline status indicators
- Message read receipts
- Responsive WhatsApp-inspired UI

## Tech Stack

- **Frontend**: React, Vite, Shadcn/ui, Tailwind CSS, TanStack Query
- **Backend**: Node.js, Express, WebSockets
- **Database**: PostgreSQL (via Neon)
- **ORM**: Drizzle ORM
- **Authentication**: Session-based auth
- **Image Handling**: Cloudinary

## Getting Started

### Prerequisites

- Node.js (v16 or later)
- npm or yarn
- PostgreSQL database (or Neon account)

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd schat-project
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Install required packages for image upload functionality:
   ```
   npm install cloudinary@1.41.0 multer-storage-cloudinary@4.0.0
   ```

4. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Update the `DATABASE_URL` and `SESSION_SECRET` in the `.env` file

### Running the Application

1. Start the development server:
   ```
   npm run dev
   ```

2. Access the application:
   - Open your browser and navigate to `http://localhost:5000`

### Building for Production

1. Build the application:
   ```
   npm run build
   ```

2. Start the production server:
   ```
   npm run start
   ```

## Troubleshooting

If you encounter any issues when running the application:

1. **Missing dependencies**:
   - Ensure you have installed all required packages, including `cloudinary` and `multer-storage-cloudinary`
   - Run `npm install cloudinary@1.41.0 multer-storage-cloudinary@4.0.0` to install compatible versions

2. **Database connection issues**:
   - Verify your `.env` file has the correct `DATABASE_URL`
   - Ensure your database is accessible from your environment

3. **Search functionality issues**:
   - Check server logs for detailed search information
   - Verify that you have at least one other user in the database besides your own account

## User Search Functionality

The search works by:
- Excluding your own account (so you can't find yourself)
- Searching both username AND userId (SCHAT_XXXXXX)
- Using case-insensitive partial matching

To test the search functionality:
1. Create at least two user accounts
2. Log in with one account
3. Search for the other account by username or SCHAT ID
4. You can use partial matches (e.g., searching for "SCHAT" will find all users with SCHAT IDs)

## License

[MIT License](LICENSE)
