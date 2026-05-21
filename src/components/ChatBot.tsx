import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";

// Floating chat icon. Routes to the full-page AI assistant (/assistant).
const ChatBot = () => {
  return (
    <Link
      to="/assistant"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full gradient-primary shadow-xl flex items-center justify-center hover:scale-110 transition-transform"
      aria-label="Open EV assistant"
    >
      <MessageCircle className="text-primary-foreground" size={24} />
    </Link>
  );
};

export default ChatBot;
