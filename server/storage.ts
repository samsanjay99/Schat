import {
  users,
  chats,
  messages,
  type User,
  type InsertUser,
  type Chat,
  type Message,
  type InsertMessage,
  type ChatWithDetails,
  type MessageWithSender,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, asc, ilike, sql, ne } from "drizzle-orm";
import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";

export interface IStorage {
  // User operations
  createUser(user: InsertUser & { password: string }): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  getUserByUserId(userId: string): Promise<User | undefined>;
  searchUsers(query: string, excludeUserId: string): Promise<User[]>;
  updateUserOnlineStatus(userId: string, isOnline: boolean): Promise<void>;
  updateUserProfile(userId: string, updates: Partial<User>): Promise<User>;
  
  // Chat operations
  createChat(user1Id: string, user2Id: string): Promise<Chat>;
  getOrCreateChat(user1Id: string, user2Id: string): Promise<Chat>;
  getUserChats(userId: string): Promise<ChatWithDetails[]>;
  getChatById(chatId: string): Promise<Chat | undefined>;
  
  // Message operations
  createMessage(message: InsertMessage): Promise<Message>;
  getChatMessages(chatId: string, limit?: number): Promise<MessageWithSender[]>;
  updateMessageStatus(messageId: string, status: string): Promise<void>;
  markMessagesAsRead(chatId: string, userId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async createUser(userData: InsertUser & { password: string }): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const userId = this.generateUserId();
    
    const [user] = await db
      .insert(users)
      .values({
        id: nanoid(),
        ...userData,
        password: hashedPassword,
        userId,
      })
      .returning();
    
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUserId(userId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.userId, userId));
    return user;
  }

  async searchUsers(query: string, excludeUserId: string): Promise<User[]> {
    // Log the search request with timestamp
    console.log(`\n=== SEARCH REQUEST ===`);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log(`Search query: "${query}"`);
    console.log(`Excluding user ID: ${excludeUserId}`);
    
    // Get the current user for logging
    const currentUser = await this.getUserById(excludeUserId);
    console.log(`Current user: ${currentUser?.username || 'Unknown'} (${currentUser?.userId || 'N/A'})`);
    
    // Validate and normalize the query
    if (!query || typeof query !== 'string') {
      console.log('❌ Invalid query, returning empty results');
      return [];
    }
    
    // Normalize the query by trimming whitespace and converting to uppercase for SCHAT_* searches
    const normalizedQuery = query.trim();
    const searchTerm = normalizedQuery.toUpperCase();
    
    if (normalizedQuery.length === 0) {
      console.log('❌ Empty query after normalization, returning empty results');
      return [];
    }
    
    try {
      console.log(`🔍 Performing search with query: "${normalizedQuery}"`);
      
      // First, try to find exact matches on userId (case-insensitive)
      const exactMatch = await db
        .select()
        .from(users)
        .where(
          and(
            ne(users.id, excludeUserId),
            sql`UPPER(${users.userId}) = ${searchTerm}`
          )
        )
        .limit(1);
      
      if (exactMatch.length > 0) {
        console.log(`✅ Found exact match for userId: ${exactMatch[0].userId}`);
        return exactMatch;
      }
      
      // If no exact match, search for partial matches in userId and username
      console.log('No exact match, searching for partial matches...');
      
      const searchResults = await db
        .select()
        .from(users)
        .where(
          and(
            ne(users.id, excludeUserId),
            or(
              // Search in userId (case-insensitive partial match)
              sql`UPPER(${users.userId}) LIKE ${'%' + searchTerm + '%'}`,
              
              // Search in username (case-insensitive partial match)
              sql`UPPER(${users.username}) LIKE ${'%' + searchTerm + '%'}`
            )
          )
        )
        .orderBy(users.userId) // Sort by userId for consistent results
        .limit(20);
      
      console.log(`🔎 Search complete. Found ${searchResults.length} results for "${normalizedQuery}"`);
      
      // Log the found users (without sensitive data)
      if (searchResults.length > 0) {
        console.log('Found users:');
        searchResults.forEach((user, index) => {
          console.log(`  ${index + 1}. ${user.userId} - ${user.username} (${user.email})`);
        });
      } else {
        console.log('No matching users found');
      }
      
      return searchResults;
    } catch (error) {
      console.error('❌ Error in searchUsers:', error);
      return [];
    } finally {
      console.log('=== END OF SEARCH ===\n');
    }
  }

  async updateUserOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
    await db
      .update(users)
      .set({
        isOnline,
        lastSeen: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async updateUserProfile(userId: string, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    
    return user;
  }

  // Chat operations
  async createChat(user1Id: string, user2Id: string): Promise<Chat> {
    const [chat] = await db
      .insert(chats)
      .values({
        id: nanoid(),
        user1Id,
        user2Id,
      })
      .returning();
    
    return chat;
  }

  async getOrCreateChat(user1Id: string, user2Id: string): Promise<Chat> {
    // Check if chat already exists (either direction)
    const [existingChat] = await db
      .select()
      .from(chats)
      .where(
        or(
          and(eq(chats.user1Id, user1Id), eq(chats.user2Id, user2Id)),
          and(eq(chats.user1Id, user2Id), eq(chats.user2Id, user1Id))
        )
      );

    if (existingChat) {
      return existingChat;
    }

    return this.createChat(user1Id, user2Id);
  }

  async getUserChats(userId: string): Promise<ChatWithDetails[]> {
    const userChats = await db
      .select({
        chat: chats,
        otherUser: users,
        lastMessage: {
          id: messages.id,
          content: messages.content,
          createdAt: messages.createdAt,
          senderId: messages.senderId,
        },
      })
      .from(chats)
      .leftJoin(users, 
        or(
          and(eq(chats.user1Id, userId), eq(users.id, chats.user2Id)),
          and(eq(chats.user2Id, userId), eq(users.id, chats.user1Id))
        )
      )
      .leftJoin(
        messages,
        and(
          eq(messages.chatId, chats.id),
          eq(messages.createdAt, 
            sql`(SELECT MAX(created_at) FROM ${messages} WHERE chat_id = ${chats.id})`
          )
        )
      )
      .where(or(eq(chats.user1Id, userId), eq(chats.user2Id, userId)))
      .orderBy(desc(chats.updatedAt));

    // Get unread message counts
    const chatsWithDetails: ChatWithDetails[] = [];
    
    for (const row of userChats) {
      if (!row.otherUser) continue;
      
      const [unreadResult] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(messages)
        .where(
          and(
            eq(messages.chatId, row.chat.id),
            ne(messages.senderId, userId),
            ne(messages.status, "read")
          )
        );

      chatsWithDetails.push({
        ...row.chat,
        otherUser: row.otherUser,
        lastMessage: row.lastMessage || undefined,
        unreadCount: Number(unreadResult?.count || 0),
      });
    }

    return chatsWithDetails;
  }

  async getChatById(chatId: string): Promise<Chat | undefined> {
    const [chat] = await db.select().from(chats).where(eq(chats.id, chatId));
    return chat;
  }

  // Message operations
  async createMessage(messageData: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values({
        id: nanoid(),
        ...messageData,
      })
      .returning();

    // Update chat's updatedAt timestamp
    await db
      .update(chats)
      .set({ updatedAt: new Date() })
      .where(eq(chats.id, messageData.chatId));

    return message;
  }

  async getChatMessages(chatId: string, limit = 50): Promise<MessageWithSender[]> {
    return await db
      .select({
        id: messages.id,
        chatId: messages.chatId,
        senderId: messages.senderId,
        content: messages.content,
        messageType: messages.messageType,
        status: messages.status,
        createdAt: messages.createdAt,
        updatedAt: messages.updatedAt,
        sender: users,
      })
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.chatId, chatId))
      .orderBy(asc(messages.createdAt))
      .limit(limit);
  }

  async updateMessageStatus(messageId: string, status: string): Promise<void> {
    await db
      .update(messages)
      .set({ status, updatedAt: new Date() })
      .where(eq(messages.id, messageId));
  }

  async markMessagesAsRead(chatId: string, userId: string): Promise<void> {
    await db
      .update(messages)
      .set({ status: "read", updatedAt: new Date() })
      .where(
        and(
          eq(messages.chatId, chatId),
          ne(messages.senderId, userId),
          ne(messages.status, "read")
        )
      );
  }

  // Utility methods
  private generateUserId(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "SCHAT_";
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Verify password
  async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}

export const storage = new DatabaseStorage();
