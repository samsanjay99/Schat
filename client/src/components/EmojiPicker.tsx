import { useState, useRef, useEffect } from "react";
import { Smile } from "lucide-react";

const emojis = [
  "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇",
  "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚",
  "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩",
  "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣",
  "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬",
  "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗",
  "🤔", "🤭", "🤫", "🤥", "😶", "😐", "😑", "😬", "🙄", "😯",
  "😦", "😧", "😮", "😲", "🥱", "😴", "🤤", "😪", "😵", "🤐",
  "🥴", "🤢", "🤮", "🤧", "😷", "🤒", "🤕", "🤑", "🤠", "💩"
];

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
}

export function EmojiPicker({ onEmojiSelect }: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Log component rendering
  useEffect(() => {
    console.log('EmojiPicker component mounted');
    return () => console.log('EmojiPicker component unmounted');
  }, []);

  // Handle outside clicks to close the emoji picker
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Toggle emoji picker visibility
  const toggleEmojiPicker = () => {
    console.log('Emoji button clicked, current state:', isOpen);
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative" ref={pickerRef}>
      <button
        type="button"
        onClick={toggleEmojiPicker}
        onMouseDown={(e) => {
          e.preventDefault(); // Prevent input blur
          console.log('Emoji button mouse down');
        }}
        className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-[#25D366] hover:bg-gray-100 rounded-full transition-colors"
        title="Add emoji"
        aria-label="Add emoji"
        data-testid="emoji-button"
      >
        <Smile className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="absolute bottom-full right-0 mb-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 p-2 z-50">
          <div className="grid grid-cols-8 gap-1 max-h-60 overflow-y-auto">
            {emojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-md text-xl focus:outline-none transition-colors"
                onClick={() => {
                  console.log('Emoji selected:', emoji);
                  onEmojiSelect(emoji);
                  setIsOpen(false);
                }}
                title={`Emoji: ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}