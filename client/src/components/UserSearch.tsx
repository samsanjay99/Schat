import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Search, SquareSlash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UserSearchProps {
  onBack: () => void;
  onChatStart: (chatId: string) => void;
}

export function UserSearch({ onBack, onChatStart }: UserSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Search for users when the search query changes
  useEffect(() => {
    // Don't search if the query is empty
    if (!searchQuery || searchQuery.trim().length === 0) {
      setUsers([]);
      setError(null);
      return;
    }

    const searchUsers = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        console.log('Searching for users with query:', searchQuery);
        const response = await fetch(`/api/users/search?query=${encodeURIComponent(searchQuery)}`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Search error:', response.status, errorText);
          setError(`Failed to search users: ${response.status}`);
          setUsers([]);
          return;
        }
        
        const data = await response.json();
        console.log('Search results:', data);
        setUsers(data);
      } catch (error) {
        console.error('Search error:', error);
        setError('An error occurred while searching for users');
        setUsers([]);
      } finally {
        setIsLoading(false);
      }
    };

    // Use a debounce to avoid too many requests
    const timeoutId = setTimeout(() => {
      searchUsers();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const createChatMutation = useMutation({
    mutationFn: async (otherUserId: string) => {
      const response = await apiRequest("POST", "/api/chats", { otherUserId });
      return response.json();
    },
    onSuccess: (chat) => {
      queryClient.invalidateQueries({ queryKey: ["/api/chats"] });
      onChatStart(chat.id);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to start chat",
        description: error.message || "An error occurred while starting the chat",
      });
    },
  });

  const handleStartChat = (user: User) => {
    createChatMutation.mutate(user.id);
  };

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center space-x-3 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="p-2 hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Button>
          <h2 className="text-lg font-semibold text-gray-800">Find Users</h2>
        </div>
        
        <div className="relative">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by User ID or Username (e.g., SCHAT_ABC123)"
            className="pl-10 bg-gray-100 border-0 focus:ring-2 focus:ring-[#25D366]"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
        </div>
      </div>

      {/* Search Results */}
      <div className="flex-1 overflow-y-auto">
        {searchQuery.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <Search className="text-gray-400 w-12 h-12" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Search for Users</h3>
            <p className="text-gray-500">
              Enter a User ID or username to find people on Schat
            </p>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-gray-500">Searching...</div>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <SquareSlash className="text-gray-400 w-12 h-12" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No users found</h3>
            <p className="text-gray-500 text-center">
              Try searching with a different User ID or username
            </p>
          </div>
        ) : (
          <div className="space-y-2 p-4">
            {users.map((user) => (
              <Card key={user.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={user.profileImageUrl || undefined} />
                        <AvatarFallback className="bg-[#075E54] text-white">
                          {user.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div>
                        <h3 className="font-semibold text-gray-900">{user.username}</h3>
                        <p className="text-sm text-gray-600 font-mono">{user.userId}</p>
                        <p className="text-xs text-green-600">
                          {user.isOnline ? "Online" : "Offline"}
                        </p>
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => handleStartChat(user)}
                      disabled={createChatMutation.isPending}
                      className="bg-[#25D366] hover:bg-[#20c55e] text-white px-4 py-2 rounded-full text-sm font-semibold"
                    >
                      {createChatMutation.isPending ? "Starting..." : "Chat"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
