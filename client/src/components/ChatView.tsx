import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type ChatWithDetails, type MessageWithSender } from "@shared/schema";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageBubble } from "./MessageBubble";
import { EmojiPicker } from "./EmojiPicker";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Phone, Video, MoreVertical, Send, Paperclip, Smile } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ChatViewProps {
  chat: ChatWithDetails;
  onBack: () => void;
}

export function ChatView({ chat, onBack }: ChatViewProps) {
  const { user } = useAuth();
  const { lastMessage, joinChat, sendTyping } = useWebSocket();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { data: messages = [], isLoading } = useQuery<MessageWithSender[]>({
    queryKey: [`/api/chats/${chat.id}/messages`],
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { content: string; messageType: string; file?: File }) => {
      const formData = new FormData();
      formData.append("content", data.content);
      formData.append("messageType", data.messageType);
      if (data.file) {
        formData.append("file", data.file);
      }

      // FormData will be detected by apiRequest and handled correctly
      const response = await apiRequest("POST", `/api/chats/${chat.id}/messages`, formData);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to send message");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/chats/${chat.id}/messages`] });
      queryClient.invalidateQueries({ queryKey: ["/api/chats"] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send message",
      });
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PATCH", `/api/chats/${chat.id}/read`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chats"] });
    },
  });

  useEffect(() => {
    joinChat(chat.id);
    markAsReadMutation.mutate();
  }, [chat.id]);

  useEffect(() => {
    if (lastMessage) {
      if (lastMessage.type === "new_message" && lastMessage.message.chatId === chat.id) {
        queryClient.invalidateQueries({ queryKey: [`/api/chats/${chat.id}/messages`] });
        queryClient.invalidateQueries({ queryKey: ["/api/chats"] });
      } else if (lastMessage.type === "typing" && lastMessage.chatId === chat.id) {
        setOtherUserTyping(lastMessage.isTyping);
        
        if (lastMessage.isTyping) {
          setTimeout(() => setOtherUserTyping(false), 3000);
        }
      }
    }
  }, [lastMessage, chat.id, queryClient]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    sendMessageMutation.mutate({
      content: message,
      messageType: "text",
    });
    setMessage("");
    
    // Stop typing indicator
    if (isTyping) {
      setIsTyping(false);
      sendTyping(chat.id, false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if file is an image
    if (!file.type.startsWith("image/")) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload an image file",
      });
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
      });
      return;
    }

    sendMessageMutation.mutate({
      content: file.name,
      messageType: "image",
      file,
    });
    
    // Clear the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage((prev) => prev + emoji);
  };

  const handleTyping = (value: string) => {
    setMessage(value);
    
    if (value.trim() && !isTyping) {
      setIsTyping(true);
      sendTyping(chat.id, true);
    } else if (!value.trim() && isTyping) {
      setIsTyping(false);
      sendTyping(chat.id, false);
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        sendTyping(chat.id, false);
      }
    }, 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-500">Loading messages...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Chat Header */}
      <div className="bg-[#075E54] text-white px-4 py-3 flex items-center shadow-sm">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="mr-3 p-1 hover:bg-[#128C7E] text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        
        <div className="flex items-center flex-1">
          <div className="relative mr-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={chat.otherUser.profileImageUrl || undefined} />
              <AvatarFallback className="bg-[#25D366] text-white">
                {chat.otherUser.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {chat.otherUser.isOnline && (
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-[#25D366] rounded-full border border-[#075E54]" />
            )}
          </div>
          
          <div className="flex-1">
            <h3 className="font-semibold">{chat.otherUser.username}</h3>
            <p className="text-xs text-green-100">
              {otherUserTyping ? (
                <span className="animate-pulse">typing...</span>
              ) : chat.otherUser.isOnline ? (
                "online"
              ) : (
                `last seen ${new Date(chat.otherUser.lastSeen || "").toLocaleTimeString()}`
              )}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" className="p-2 hover:bg-[#128C7E] text-white">
            <Phone className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="sm" className="p-2 hover:bg-[#128C7E] text-white">
            <Video className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="sm" className="p-2 hover:bg-[#128C7E] text-white">
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-3"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundColor: "#E5DDD5",
        }}
      >
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isOwn={msg.senderId === user?.id}
          />
        ))}
        
        {otherUserTyping && (
          <div className="flex justify-start">
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white border-t px-4 py-3">
        <div className="flex items-center space-x-3">
          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
            data-testid="file-input"
          />
          
          {/* File upload button */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              console.log('Paperclip clicked, opening file selector');
              // Directly trigger the file input click
              if (fileInputRef.current) {
                fileInputRef.current.click();
              } else {
                console.error('File input ref is null');
              }
            }}
            className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-[#25D366] hover:bg-gray-100 rounded-full transition-colors"
            title="Attach image"
            aria-label="Attach image"
            data-testid="file-upload-button"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          
          {/* Message input with emoji picker */}
          <div className="flex-1 relative">
            <Input
              value={message}
              onChange={(e) => handleTyping(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="pr-10 bg-gray-100 border-0 focus:ring-2 focus:ring-[#25D366]"
              aria-label="Message input"
              data-testid="message-input"
            />
            <div 
              className="absolute right-1 top-1/2 transform -translate-y-1/2"
              onClick={(e) => {
                // Stop event propagation to prevent input blur
                e.stopPropagation();
                console.log('Emoji picker container clicked');
              }}
            >
              <EmojiPicker onEmojiSelect={handleEmojiSelect} />
            </div>
          </div>
          
          {/* Send button */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              console.log('Send button clicked');
              handleSendMessage();
            }}
            disabled={!message.trim() || sendMessageMutation.isPending}
            className="w-10 h-10 flex items-center justify-center bg-[#25D366] hover:bg-[#20c55e] text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Send message"
            aria-label="Send message"
            data-testid="send-button"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        
        {/* Loading indicator */}
        {sendMessageMutation.isPending && (
          <div className="text-xs text-gray-500 mt-1 ml-2">Sending...</div>
        )}
      </div>
    </div>
  );
}
