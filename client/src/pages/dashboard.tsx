import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { type ChatWithDetails } from "@shared/schema";
import { ChatList } from "@/components/ChatList";
import { ChatView } from "@/components/ChatView";
import { UserSearch } from "@/components/UserSearch";
import { ProfileView } from "@/components/ProfileView";
import { BottomNavigation } from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import { Search, MoreVertical } from "lucide-react";
import { Input } from "@/components/ui/input";

type ViewType = "chats" | "chat" | "search" | "profile";

export default function DashboardPage() {
  const [currentView, setCurrentView] = useState<ViewType>("chats");
  const [selectedChat, setSelectedChat] = useState<ChatWithDetails | null>(null);
  const [activeTab, setActiveTab] = useState<"chats" | "contacts" | "profile">("chats");
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: chats = [] } = useQuery<ChatWithDetails[]>({
    queryKey: ["/api/chats"],
  });

  const handleChatSelect = (chat: ChatWithDetails) => {
    setSelectedChat(chat);
    setCurrentView("chat");
  };

  const handleBackToChats = () => {
    setCurrentView("chats");
    setSelectedChat(null);
    setActiveTab("chats");
  };

  const handleChatStart = (chatId: string) => {
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      handleChatSelect(chat);
    } else {
      // Refetch chats and then select the new chat
      window.location.reload(); // Simple approach for now
    }
  };

  const handleTabChange = (tab: "chats" | "contacts" | "profile") => {
    setActiveTab(tab);
    switch (tab) {
      case "chats":
        setCurrentView("chats");
        break;
      case "contacts":
        setCurrentView("search");
        break;
      case "profile":
        setCurrentView("profile");
        break;
    }
  };

  const filteredChats = chats.filter(chat =>
    chat.otherUser.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.otherUser.userId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderCurrentView = () => {
    switch (currentView) {
      case "chat":
        return selectedChat ? (
          <ChatView chat={selectedChat} onBack={handleBackToChats} />
        ) : null;
        
      case "search":
        return <UserSearch onBack={handleBackToChats} onChatStart={handleChatStart} />;
        
      case "profile":
        return <ProfileView onBack={handleBackToChats} />;
        
      default:
        return <ChatList onChatSelect={handleChatSelect} />;
    }
  };

  const showBottomNav = currentView !== "chat";
  const showHeader = currentView === "chats";

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Header */}
      {showHeader && (
        <header className="bg-[#075E54] text-white px-4 py-3 flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#25D366] rounded-full flex items-center justify-center">
              <span className="text-white text-lg font-bold">S</span>
            </div>
            <h1 className="text-xl font-semibold">Schat</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSearchBar(!showSearchBar)}
              className="p-2 hover:bg-[#128C7E] text-white"
            >
              <Search className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="p-2 hover:bg-[#128C7E] text-white"
            >
              <MoreVertical className="w-5 h-5" />
            </Button>
          </div>
        </header>
      )}

      {/* Search Bar */}
      {showSearchBar && showHeader && (
        <div className="bg-white border-b px-4 py-3">
          <div className="relative">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats"
              className="pl-10 bg-gray-100 border-0 focus:ring-2 focus:ring-[#25D366]"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {currentView === "chats" && showSearchBar && searchQuery ? (
          <ChatList onChatSelect={handleChatSelect} />
        ) : (
          renderCurrentView()
        )}
      </div>

      {/* Bottom Navigation */}
      {showBottomNav && (
        <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />
      )}
    </div>
  );
}
