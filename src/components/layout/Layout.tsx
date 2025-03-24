
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Layout() {
  const [showHelp, setShowHelp] = useState(false);
  
  const handleHelpClick = () => {
    toast.info("Streaming Help", {
      description: "If you're having trouble with video playback, try using a modern browser like Chrome or Firefox, or check your internet connection.",
      duration: 5000,
      action: {
        label: "More Info",
        onClick: () => window.open("https://www.videolan.org/vlc/", "_blank")
      }
    });
  };
  
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto py-6 px-4">
        <Outlet />
      </main>
      
      <Button 
        variant="outline" 
        size="icon" 
        className="fixed bottom-4 right-4 rounded-full shadow-md bg-white/80 backdrop-blur-sm hover:bg-white"
        onClick={handleHelpClick}
      >
        <HelpCircle className="h-5 w-5" />
      </Button>
    </div>
  );
}
