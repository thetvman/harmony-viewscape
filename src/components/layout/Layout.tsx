
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export default function Layout() {
  const [showHelp, setShowHelp] = useState(false);
  
  const handleHelpClick = () => {
    setShowHelp(true);
  };
  
  const handleVlcDownload = () => {
    window.open("https://www.videolan.org/vlc/", "_blank");
  };
  
  const handleVlcBrowserPlugin = () => {
    window.open("https://addons.videolan.org/", "_blank");
    toast.info("VLC Browser Plugin", {
      description: "After installing the plugin, you may need to restart your browser for it to take effect.",
    });
  };
  
  const handleVlcProtocolHandler = () => {
    // Demonstrate VLC protocol handler
    const vlcUrl = `vlc://${window.location.href}`;
    try {
      window.location.href = vlcUrl;
      toast.info("Opening VLC", {
        description: "If VLC doesn't open automatically, you may need to install it first.",
      });
    } catch (error) {
      toast.error("Failed to open VLC", {
        description: "Make sure VLC is installed and properly registered as a protocol handler.",
      });
    }
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
      
      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Streaming Help</DialogTitle>
            <DialogDescription>
              Having trouble with video playback? Try these options:
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h3 className="font-medium">Streaming Issues</h3>
              <p className="text-sm text-muted-foreground">
                If you're having trouble with video formats like .ts files, consider using VLC which supports almost all formats.
              </p>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              <Button variant="outline" onClick={handleVlcDownload}>
                Download VLC Player
              </Button>
              
              <Button variant="outline" onClick={handleVlcBrowserPlugin}>
                Get VLC Browser Plugin
              </Button>
              
              <Button variant="outline" onClick={handleVlcProtocolHandler}>
                Open Current Stream in VLC
              </Button>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium">Alternative Options</h3>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
                <li>Try using Chrome or Firefox for best compatibility</li>
                <li>Check your internet connection</li>
                <li>Clear your browser cache</li>
                <li>Disable any ad blockers or script blockers</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
