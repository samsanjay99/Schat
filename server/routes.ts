import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage as dbStorage } from "./storage";
import { loginSchema, signupSchema, messageSchema, searchUserSchema } from "@shared/schema";
import { ZodError } from "zod";
import session from "express-session";
import MemoryStore from "memorystore";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import express from "express";
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Augment express-session
declare module 'express-session' {
  interface SessionData {
    userId?: string;
  }
}

const MemoryStoreSession = MemoryStore(session);

interface AuthenticatedRequest extends Request {
  userId?: string;
}

interface WebSocketClient extends WebSocket {
  userId?: string;
  chatId?: string;
}

const connectedClients = new Map<string, WebSocketClient>();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Determine if Cloudinary credentials are available
const useCloudinary = process.env.CLOUDINARY_CLOUD_NAME && 
                     process.env.CLOUDINARY_API_KEY && 
                     process.env.CLOUDINARY_API_SECRET;

let uploadStorage;

if (useCloudinary) {
  // Configure Cloudinary
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });

  // Configure Cloudinary storage
  uploadStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      // Use type assertion to handle the params type issue
      folder: 'chat-uploads' as any,
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif'] as any,
      transformation: [{ width: 1000, height: 1000, crop: 'limit' }] as any
    }
  });
  
  console.log('Using Cloudinary for file uploads');
} else {
  // Use local disk storage if Cloudinary is not configured
  uploadStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
  });
  
  console.log('Using local storage for file uploads');
}

// Configure multer with the selected storage
const upload = multer({
  storage: uploadStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || 'schat-secret-key',
    store: new MemoryStoreSession({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Explicitly set to false for local development
      httpOnly: true,
      sameSite: 'lax', // Add sameSite attribute
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    },
  }));

  // Auth middleware
  const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    req.userId = req.session.userId;
    next();
  };

  // Error handler
  const handleError = (error: any, res: Response) => {
    if (error instanceof ZodError) {
      return res.status(400).json({ 
        message: "Validation error", 
        errors: error.errors 
      });
    }
    
    console.error("Server error:", error);
    return res.status(500).json({ 
      message: error.message || "Internal server error" 
    });
  };

  // Auth routes
  app.post("/api/auth/signup", async (req: Request, res: Response) => {
    try {
      const userData = signupSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await dbStorage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ 
          message: "This email is already registered. Please sign in or use a different email." 
        });
      }

      const user = await dbStorage.createUser(userData);
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      res.status(201).json({ 
        message: "Account created successfully. Please sign in to continue.",
        user: userWithoutPassword 
      });
    } catch (error) {
      handleError(error, res);
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const user = await dbStorage.getUserByEmail(email);
      if (!user) {
        return res.status(400).json({ 
          message: "No account found with this email. Please check and try again." 
        });
      }

      const isValidPassword = await dbStorage.verifyPassword(password, user.password);
      if (!isValidPassword) {
        return res.status(400).json({ 
          message: "Incorrect password. Please try again." 
        });
      }

      // Set session
      req.session!.userId = user.id;
      
      // Update online status
      await dbStorage.updateUserOnlineStatus(user.id, true);
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      
      res.json({ 
        message: "Login successful",
        user: userWithoutPassword 
      });
    } catch (error) {
      handleError(error, res);
    }
  });

  app.post("/api/auth/logout", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (req.userId) {
        await dbStorage.updateUserOnlineStatus(req.userId, false);
      }
      
      req.session?.destroy((err) => {
        if (err) {
          return res.status(500).json({ message: "Could not log out" });
        }
        res.json({ message: "Logged out successfully" });
      });
    } catch (error) {
      handleError(error, res);
    }
  });

  app.get("/api/auth/me", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await dbStorage.getUserById(req.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      handleError(error, res);
    }
  });

  // User routes
  // Simple user search endpoint
  app.get("/api/users/search", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Log the incoming request
      console.log(`Search request from user ${req.userId}: ${req.url}`);
      
      // Get the query parameter
      const query = req.query.query;
      
      // Validate the query parameter
      if (!query || typeof query !== 'string' || query.trim().length === 0) {
        console.log('Invalid or missing query parameter');
        return res.status(400).json({ message: "Please provide a valid search query" });
      }
      
      // Perform the search with the validated query
      console.log(`Searching for users with query: "${query}"`);
      const users = await dbStorage.searchUsers(query.trim(), req.userId!);
      
      // Log the results
      console.log(`Found ${users.length} users matching "${query}"`);
      
      // Remove sensitive information from the response
      const safeUsers = users.map(({ password, ...user }) => user);
      
      // Return the results
      return res.json(safeUsers);
    } catch (error) {
      console.error('Error in user search:', error);
      return handleError(error, res);
    }
  });

  app.patch("/api/users/profile", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const updates = req.body;
      
      // Don't allow changing sensitive fields
      delete updates.id;
      delete updates.email;
      delete updates.password;
      delete updates.userId;
      
      const updatedUser = await dbStorage.updateUserProfile(req.userId!, updates);
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.json(userWithoutPassword);
    } catch (error) {
      handleError(error, res);
    }
  });

  // Chat routes
  app.get("/api/chats", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const chats = await dbStorage.getUserChats(req.userId!);
      res.json(chats);
    } catch (error) {
      handleError(error, res);
    }
  });

  app.post("/api/chats", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { otherUserId } = req.body;
      
      if (!otherUserId) {
        return res.status(400).json({ message: "otherUserId is required" });
      }
      
      const chat = await dbStorage.getOrCreateChat(req.userId!, otherUserId);
      res.json(chat);
    } catch (error) {
      handleError(error, res);
    }
  });

  app.get("/api/chats/:chatId/messages", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { chatId } = req.params;
      
      // Verify user has access to this chat
      const chat = await dbStorage.getChatById(chatId);
      if (!chat || (chat.user1Id !== req.userId && chat.user2Id !== req.userId)) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const messages = await dbStorage.getChatMessages(chatId);
      res.json(messages);
    } catch (error) {
      handleError(error, res);
    }
  });

  app.post("/api/chats/:chatId/messages", requireAuth, upload.single("file"), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { chatId } = req.params;
      
      // Verify user has access to this chat
      const chat = await dbStorage.getChatById(chatId);
      if (!chat || (chat.user1Id !== req.userId && chat.user2Id !== req.userId)) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      if (!req.body.content && !req.file) {
        return res.status(400).json({ message: "Message content or file is required" });
      }
      
      let fileUrl = '';
      
      // Handle file upload
      if (req.file) {
        console.log('File uploaded:', req.file);
        
        if (useCloudinary) {
          // For Cloudinary, the URL is already set in req.file.path
          fileUrl = req.file.path;
        } else {
          // For local storage, construct the URL
          const filename = req.file.filename;
          fileUrl = `/uploads/${filename}`;
        }
      }
      
      const messageData = {
        chatId,
        senderId: req.userId!,
        content: req.file ? fileUrl : req.body.content,
        messageType: req.file ? "image" : "text",
      };
      
      console.log('Creating message with data:', messageData);
      
      const message = await dbStorage.createMessage(messageData);
      
      // Broadcast message to WebSocket clients
      const otherUserId = chat.user1Id === req.userId ? chat.user2Id : chat.user1Id;
      const otherUserClient = connectedClients.get(otherUserId);
      
      if (otherUserClient && otherUserClient.readyState === WebSocket.OPEN) {
        const sender = await dbStorage.getUserById(req.userId!);
        otherUserClient.send(JSON.stringify({
          type: 'new_message',
          message: {
            ...message,
            sender: sender ? { ...sender, password: undefined } : null,
          },
        }));
      }
      
      res.status(201).json(message);
    } catch (error) {
      console.error("Error creating message:", error);
      handleError(error, res);
    }
  });

  app.patch("/api/messages/:messageId/read", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { messageId } = req.params;
      await dbStorage.updateMessageStatus(messageId, "read");
      res.json({ message: "Message marked as read" });
    } catch (error) {
      handleError(error, res);
    }
  });

  app.patch("/api/chats/:chatId/read", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { chatId } = req.params;
      await dbStorage.markMessagesAsRead(chatId, req.userId!);
      res.json({ message: "Messages marked as read" });
    } catch (error) {
      handleError(error, res);
    }
  });

  // Create uploads directory if it doesn't exist
  const uploadsDir = path.join(__dirname, "../uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Serve uploaded files
  app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

  // Create HTTP server
  const httpServer = createServer(app);

  // WebSocket server
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws' 
  });

  wss.on('connection', (ws: WebSocketClient, req) => {
    console.log('WebSocket client connected');

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'auth':
            // Simple auth - in production, verify JWT or session
            const userId = message.userId;
            if (userId) {
              ws.userId = userId;
              connectedClients.set(userId, ws);
              await dbStorage.updateUserOnlineStatus(userId, true);
              
              // Notify other users that this user is online
              broadcastUserStatus(userId, true);
            }
            break;
            
          case 'join_chat':
            ws.chatId = message.chatId;
            break;
            
          case 'typing':
            // Broadcast typing indicator to other user in chat
            if (ws.chatId && ws.userId) {
              const chat = await dbStorage.getChatById(ws.chatId);
              if (chat) {
                const otherUserId = chat.user1Id === ws.userId ? chat.user2Id : chat.user1Id;
                const otherUserClient = connectedClients.get(otherUserId);
                
                if (otherUserClient && otherUserClient.readyState === WebSocket.OPEN) {
                  otherUserClient.send(JSON.stringify({
                    type: 'typing',
                    chatId: ws.chatId,
                    userId: ws.userId,
                    isTyping: message.isTyping,
                  }));
                }
              }
            }
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', async () => {
      console.log('WebSocket client disconnected');
      
      if (ws.userId) {
        connectedClients.delete(ws.userId);
        await dbStorage.updateUserOnlineStatus(ws.userId, false);
        
        // Notify other users that this user is offline
        broadcastUserStatus(ws.userId, false);
      }
    });
  });

  function broadcastUserStatus(userId: string, isOnline: boolean) {
    connectedClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN && client.userId !== userId) {
        client.send(JSON.stringify({
          type: 'user_status',
          userId,
          isOnline,
          lastSeen: new Date().toISOString(),
        }));
      }
    });
  }

  return httpServer;
}
