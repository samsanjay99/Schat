import { type MessageWithSender } from "@shared/schema";
import { CheckCheck, Check } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface MessageBubbleProps {
  message: MessageWithSender;
  isOwn: boolean;
}

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const getStatusIcon = () => {
    switch (message.status) {
      case "sent":
        return <Check className="w-3 h-3 text-gray-500" />;
      case "delivered":
        return <CheckCheck className="w-3 h-3 text-gray-500" />;
      case "read":
        return <CheckCheck className="w-3 h-3 text-[#34B7F1]" />;
      default:
        return null;
    }
  };

  const renderContent = () => {
    if (message.messageType === "image") {
      return (
        <div className="space-y-1">
          <img
            src={message.content}
            alt="Shared image"
            className="max-w-full rounded-lg"
            style={{ maxHeight: "300px" }}
          />
          <p className="text-xs text-gray-500">{message.content.split("/").pop()}</p>
        </div>
      );
    }
    return <p className="text-sm whitespace-pre-wrap">{message.content}</p>;
  };

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-xs lg:max-w-md rounded-lg p-3 shadow-sm ${
          isOwn
            ? "bg-[#DCF8C6] text-gray-800"
            : "bg-white text-gray-800"
        }`}
      >
        {renderContent()}
        <div className="flex justify-end items-center mt-1 space-x-1">
          <span className="text-xs text-gray-500">
            {formatDistanceToNow(new Date(message.createdAt), { addSuffix: false })}
          </span>
          {isOwn && getStatusIcon()}
        </div>
      </div>
    </div>
  );
}
