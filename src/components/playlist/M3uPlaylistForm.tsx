
import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { m3uService } from "@/services/m3uService";
import { Play, Loader2 } from "lucide-react";

export default function M3uPlaylistForm() {
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [playlistName, setPlaylistName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validation
    if (!playlistUrl.trim()) {
      toast.error("Please enter a playlist URL");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Validate the URL
      if (!playlistUrl.startsWith("http")) {
        throw new Error("URL must start with http:// or https://");
      }
      
      if (!playlistUrl.includes(".m3u") && !playlistUrl.endsWith(".m3u8")) {
        toast.warning("URL doesn't seem to be an M3U playlist. Make sure it's a valid M3U playlist URL.");
      }
      
      m3uService.setCredentials({
        url: playlistUrl.trim()
      });
      
      // Try to load channels to verify the playlist works
      await m3uService.loadChannels();
      
      toast.success("Successfully connected to playlist", {
        description: "Playlist loaded successfully"
      });
      
      window.location.href = "/live"; // Redirect to live TV page
    } catch (error) {
      let message = "Failed to connect to playlist";
      if (error instanceof Error) {
        message = error.message;
      }
      toast.error(message);
      m3uService.clearCredentials();
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card className="backdrop-blur-card w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="h-5 w-5 text-primary" />
          Connect to M3U Playlist
        </CardTitle>
        <CardDescription>
          Enter your M3U playlist URL 
          (Example: http://example.com/playlist.m3u8)
        </CardDescription>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="playlistUrl">Playlist URL</Label>
            <Input
              id="playlistUrl"
              placeholder="http://example.com/get.php?username=user&password=pass&output=m3u8"
              value={playlistUrl}
              onChange={(e) => setPlaylistUrl(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="playlistName">Playlist Name (Optional)</Label>
            <Input
              id="playlistName"
              placeholder="My IPTV"
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </CardContent>
        
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>Connect</>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
