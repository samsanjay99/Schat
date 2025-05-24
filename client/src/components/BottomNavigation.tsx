import { Button } from "@/components/ui/button";
import { MessageCircle, Users, User } from "lucide-react";

interface BottomNavigationProps {
  activeTab: "chats" | "contacts" | "profile";
  onTabChange: (tab: "chats" | "contacts" | "profile") => void;
}

export function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  const tabs = [
    {
      id: "chats" as const,
      label: "Chats",
      icon: MessageCircle,
    },
    {
      id: "contacts" as const,
      label: "Contacts",
      icon: Users,
    },
    {
      id: "profile" as const,
      label: "Profile",
      icon: User,
    },
  ];

  return (
    <nav className="bg-white border-t px-4 py-2 flex justify-around items-center">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        return (
          <Button
            key={tab.id}
            variant="ghost"
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center space-y-1 p-2 ${
              isActive 
                ? "text-[#075E54]" 
                : "text-gray-500 hover:text-[#075E54]"
            }`}
          >
            <Icon className="w-6 h-6" />
            <span className={`text-xs ${isActive ? "font-semibold" : ""}`}>
              {tab.label}
            </span>
          </Button>
        );
      })}
    </nav>
  );
}
