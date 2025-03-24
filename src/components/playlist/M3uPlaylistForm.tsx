
import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { m3uService } from "@/services/m3uService";
import { xtreamService } from "@/services/xtreamService";
import { XtreamCredentials } from "@/types/iptv";
import { Play, Loader2 } from "lucide-react";

export default function M3uPlaylistForm() {
  const [activeTab, setActiveTab] = useState<string>("m3u");
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [playlistName, setPlaylistName] = useState("");
  const [domain, setDomain] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [useXtreamMetadata, setUseXtreamMetadata] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleM3uSubmit = async (e: React.FormEvent) => {
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
      
      // If using Xtream metadata but in M3U mode
      if (useXtreamMetadata) {
        if (!domain.trim() || !username.trim() || !password.trim()) {
          toast.error("Please enter Xtream credentials for metadata");
          setIsLoading(false);
          return;
        }
        
        // Format domain
        let formattedDomain = domain.trim();
        if (!formattedDomain.startsWith("http")) {
          formattedDomain = `http://${formattedDomain}`;
        }
        
        const credentials: XtreamCredentials = {
          domain: formattedDomain,
          username: username.trim(),
          password: password.trim()
        };
        
        // Set credentials for Xtream
        xtreamService.setCredentials(credentials);
        
        // Store preference
        localStorage.setItem("use_xtream_metadata", "true");
        
        // Try to authenticate with Xtream
        try {
          await xtreamService.authenticate();
        } catch (error) {
          console.error("Failed to authenticate with Xtream:", error);
          toast.warning("Connected to M3U but Xtream metadata failed. Using M3U metadata instead.");
          localStorage.setItem("use_xtream_metadata", "false");
        }
      } else {
        localStorage.setItem("use_xtream_metadata", "false");
      }
      
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
      xtreamService.clearCredentials();
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleXtreamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validation
    if (!domain.trim()) {
      toast.error("Please enter a domain");
      return;
    }
    
    if (!username.trim() || !password.trim()) {
      toast.error("Please enter both username and password");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Format domain
      let formattedDomain = domain.trim();
      if (!formattedDomain.startsWith("http")) {
        formattedDomain = `http://${formattedDomain}`;
      }
      
      const credentials: XtreamCredentials = {
        domain: formattedDomain,
        username: username.trim(),
        password: password.trim()
      };
      
      // Set credentials and attempt authentication
      xtreamService.setCredentials(credentials);
      await xtreamService.authenticate();
      
      // Also set M3U credentials for direct playback
      const m3uUrl = `${formattedDomain}/get.php?username=${username.trim()}&password=${password.trim()}&type=m3u_plus&output=ts`;
      
      m3uService.setCredentials({
        url: m3uUrl
      });
      
      // Always use Xtream metadata when connecting via Xtream
      localStorage.setItem("use_xtream_metadata", "true");
      
      toast.success("Successfully connected to playlist");
      window.location.href = "/live"; // Redirect to live TV page
    } catch (error) {
      let message = "Failed to connect to playlist";
      if (error instanceof Error) {
        message = error.message;
      }
      toast.error(message);
      xtreamService.clearCredentials();
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
          Connect to Playlist
        </CardTitle>
        <CardDescription>
          Choose your connection method below
        </CardDescription>
      </CardHeader>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <CardContent>
          <TabsList className="w-full mb-4">
            <TabsTrigger value="m3u" className="flex-1">M3U Playlist</TabsTrigger>
            <TabsTrigger value="xtream" className="flex-1">Xtream Codes</TabsTrigger>
          </TabsList>
          
          <TabsContent value="m3u">
            <form onSubmit={handleM3uSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="playlistUrl">Playlist URL</Label>
                <Input
                  id="playlistUrl"
                  placeholder="http://example.com/playlist.m3u8"
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
              
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox 
                  id="useXtreamMetadata" 
                  checked={useXtreamMetadata}
                  onCheckedChange={(checked) => setUseXtreamMetadata(checked as boolean)}
                />
                <label 
                  htmlFor="useXtreamMetadata" 
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Use Xtream API for metadata (better organization)
                </label>
              </div>
              
              {useXtreamMetadata && (
                <div className="space-y-4 pt-2 border-t">
                  <p className="text-sm text-muted-foreground">
                    Enter Xtream credentials for metadata (for better organization):
                  </p>
                  
                  <div className="space-y-2">
                    <Label htmlFor="xtreamDomain">Domain</Label>
                    <Input
                      id="xtreamDomain"
                      placeholder="example.com"
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="xtreamUsername">Username</Label>
                    <Input
                      id="xtreamUsername"
                      placeholder="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="xtreamPassword">Password</Label>
                    <Input
                      id="xtreamPassword"
                      type="password"
                      placeholder="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              )}
              
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
            </form>
          </TabsContent>
          
          <TabsContent value="xtream">
            <form onSubmit={handleXtreamSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="domain">Domain</Label>
                <Input
                  id="domain"
                  placeholder="example.com"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
              
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
            </form>
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
}
