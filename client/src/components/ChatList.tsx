import { useQuery } from "@tanstack/react-query";
import { type ChatWithDetails } from "@shared/schema";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CheckCheck, MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ChatListProps {
  onChatSelect: (chat: ChatWithDetails) => void;
}

export function ChatList({ onChatSelect }: ChatListProps) {
  const { data: chats = [], isLoading } = useQuery<ChatWithDetails[]>({
    queryKey: ["/api/chats"],
  });

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-500">Loading chats...</div>
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <MessageCircle className="text-gray-400 w-16 h-16" />
        </div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">No chats yet</h3>
        <p className="text-gray-500 text-center mb-6">
          Search for users by their unique ID to start chatting
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-white">
      {chats.map((chat) => (
        <div
          key={chat.id}
          onClick={() => onChatSelect(chat)}
          className="flex items-center p-4 border-b hover:bg-gray-50 cursor-pointer transition-colors"
        >
          <div className="relative mr-3">
            <Avatar className="w-12 h-12">
              <AvatarImage src={chat.otherUser.profileImageUrl || undefined} />
              <AvatarFallback className="bg-[#075E54] text-white">
                {chat.otherUser.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {chat.otherUser.isOnline && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#25D366] rounded-full border-2 border-white" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
              <h3 className="font-semibold text-gray-900 truncate">
                {chat.otherUser.username}
              </h3>
              {chat.lastMessage && (
                <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                  {formatDistanceToNow(new Date(chat.lastMessage.createdAt), { addSuffix: true })}
                </span>
              )}
            </div>
            
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600 truncate">
                {chat.lastMessage?.content || "No messages yet"}
              </p>
              
              <div className="flex items-center space-x-1 flex-shrink-0 ml-2">
                {chat.lastMessage && (
                  <CheckCheck className="w-4 h-4 text-[#34B7F1]" />
                )}
                {chat.unreadCount > 0 && (
                  <Badge variant="default" className="bg-[#25D366] hover:bg-[#25D366]">
                    {chat.unreadCount}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
