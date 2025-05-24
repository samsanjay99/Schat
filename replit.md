# Schat - Real-time Chat Application

## Overview

Schat is a WhatsApp-inspired real-time chat application built with a modern full-stack architecture. Users can create accounts with unique IDs (SCHAT_XXXXXX), search for other users, and engage in one-on-one conversations with real-time messaging capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application follows a full-stack TypeScript architecture with a clear separation between client and server code:

### Frontend Architecture
- **Framework**: React with Vite for fast development and building
- **UI Library**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom WhatsApp-inspired color scheme
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js for REST API
- **Real-time Communication**: WebSocket server for live messaging
- **Database**: PostgreSQL with Drizzle ORM
- **Session Management**: Express sessions with memory store
- **Authentication**: Session-based authentication with bcrypt password hashing

## Key Components

### Database Schema
- **Users Table**: Stores user profiles with unique SCHAT_XXXXXX IDs, online status, and profile information
- **Chats Table**: Manages one-on-one conversations between users
- **Messages Table**: Stores chat messages with delivery status tracking
- **Sessions Table**: Handles user authentication sessions

### Authentication System
- Session-based authentication using express-session
- Password hashing with bcryptjs
- Unique user ID generation (SCHAT_XXXXXX format)
- Protected routes requiring authentication

### Real-time Features
- WebSocket connections for instant messaging
- User online/offline status tracking
- Message delivery status (sent, delivered, read)
- Typing indicators

### UI Components
- **ChatList**: Display user conversations with last message preview
- **ChatView**: Full conversation interface with message bubbles
- **UserSearch**: Find users by their unique IDs
- **ProfileView**: User profile management
- **BottomNavigation**: Mobile-friendly navigation

## Data Flow

1. **User Registration/Login**: Users create accounts or authenticate through the REST API
2. **Chat Discovery**: Users search for others by unique IDs and initiate conversations
3. **Real-time Messaging**: WebSocket connections handle live message exchange
4. **Message Persistence**: All messages are stored in PostgreSQL with status tracking
5. **State Synchronization**: TanStack Query manages client-server state synchronization

## External Dependencies

### Database
- **Neon Serverless PostgreSQL**: Cloud-hosted database with connection pooling
- **Drizzle ORM**: Type-safe database queries and migrations

### UI Framework
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first styling framework
- **Lucide React**: Icon library

### Development Tools
- **Vite**: Fast build tool with HMR
- **TypeScript**: Type safety across the stack
- **ESBuild**: Production bundling for server code

## Deployment Strategy

The application is configured for deployment on Replit with the following setup:

### Development
- `npm run dev`: Starts the development server with file watching
- Vite handles client-side hot module replacement
- Server restarts automatically on file changes

### Production Build
- `npm run build`: Compiles client code with Vite and bundles server with ESBuild
- Static assets are served from the `dist/public` directory
- Server code is bundled into `dist/index.js`

### Environment Configuration
- Database connection through `DATABASE_URL` environment variable
- Session secret for authentication security
- Automatic PostgreSQL provisioning in Replit environment

The application uses a monorepo structure with shared TypeScript schemas between client and server, ensuring type safety across the entire stack. The WebSocket implementation provides real-time functionality while the REST API handles standard CRUD operations and authentication.