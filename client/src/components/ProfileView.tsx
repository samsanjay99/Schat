import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Camera, Edit, Copy, Download, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProfileViewProps {
  onBack: () => void;
}

export function ProfileView({ onBack }: ProfileViewProps) {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingUsername, setEditingUsername] = useState(false);
  const [editingStatus, setEditingStatus] = useState(false);
  const [username, setUsername] = useState(user?.username || "");
  const [status, setStatus] = useState(user?.status || "");

  const updateProfileMutation = useMutation({
    mutationFn: async (updates: any) => {
      const response = await apiRequest("PATCH", "/api/users/profile", updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: error.message || "Failed to update profile",
      });
    },
  });

  const handleUsernameUpdate = () => {
    if (username.trim() !== user?.username) {
      updateProfileMutation.mutate({ username: username.trim() });
    }
    setEditingUsername(false);
  };

  const handleStatusUpdate = () => {
    if (status.trim() !== user?.status) {
      updateProfileMutation.mutate({ status: status.trim() });
    }
    setEditingStatus(false);
  };

  const handleCopyUserId = () => {
    if (user?.userId) {
      navigator.clipboard.writeText(user.userId);
      toast({
        title: "User ID copied",
        description: "Your User ID has been copied to clipboard",
      });
    }
  };

  const handleLogout = () => {
    logout.mutate();
  };

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-500">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <div className="bg-[#075E54] text-white px-4 py-3 flex items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="mr-3 p-1 hover:bg-[#128C7E] text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-lg font-semibold">Profile</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Profile Header */}
        <div className="bg-[#075E54] text-white p-6 text-center">
          <div className="relative inline-block mb-4">
            <Avatar className="w-24 h-24 mx-auto border-4 border-white">
              <AvatarImage src={user.profileImageUrl || undefined} />
              <AvatarFallback className="bg-[#25D366] text-white text-2xl">
                {user.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Button
              size="sm"
              className="absolute bottom-0 right-0 bg-[#25D366] hover:bg-[#20c55e] p-2 rounded-full"
            >
              <Camera className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Profile Info */}
        <div className="p-6 space-y-6">
          {/* Username */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label className="text-sm font-semibold text-gray-700">Username</Label>
                  {editingUsername ? (
                    <div className="flex items-center space-x-2 mt-1">
                      <Input
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="flex-1"
                        onBlur={handleUsernameUpdate}
                        onKeyPress={(e) => e.key === "Enter" && handleUsernameUpdate()}
                        autoFocus
                      />
                    </div>
                  ) : (
                    <p className="text-gray-800 mt-1">{user.username}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingUsername(!editingUsername);
                    setUsername(user.username);
                  }}
                  className="text-[#075E54] hover:text-[#128C7E]"
                >
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Email */}
          <Card>
            <CardContent className="p-4">
              <Label className="text-sm font-semibold text-gray-700">Email</Label>
              <p className="text-gray-600 mt-1">{user.email}</p>
            </CardContent>
          </Card>

          {/* User ID */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label className="text-sm font-semibold text-gray-700">Unique User ID</Label>
                  <p className="text-gray-800 font-mono mt-1">{user.userId}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Share this ID with friends so they can find you
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyUserId}
                  className="text-[#075E54] hover:text-[#128C7E]"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Status */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label className="text-sm font-semibold text-gray-700">Status</Label>
                  {editingStatus ? (
                    <div className="flex items-center space-x-2 mt-1">
                      <Input
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="flex-1"
                        onBlur={handleStatusUpdate}
                        onKeyPress={(e) => e.key === "Enter" && handleStatusUpdate()}
                        autoFocus
                      />
                    </div>
                  ) : (
                    <p className="text-gray-800 mt-1">{user.status || "Available"}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingStatus(!editingStatus);
                    setStatus(user.status || "Available");
                  }}
                  className="text-[#075E54] hover:text-[#128C7E]"
                >
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="p-6 space-y-4 border-t">
          <Button
            variant="outline"
            className="w-full flex items-center justify-center space-x-3 p-4"
          >
            <Download className="w-5 h-5" />
            <span>Export Chat History</span>
          </Button>
          
          <Button
            onClick={handleLogout}
            disabled={logout.isPending}
            variant="destructive"
            className="w-full flex items-center justify-center space-x-3 p-4"
          >
            <LogOut className="w-5 h-5" />
            <span>{logout.isPending ? "Signing Out..." : "Sign Out"}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
