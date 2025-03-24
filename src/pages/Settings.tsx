
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { m3uService } from "@/services/m3uService";
import { xtreamService } from "@/services/xtreamService";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Play, Settings2, LogOut, RefreshCw, Info, Database } from "lucide-react";

export default function SettingsPage() {
  const [playlistInfo, setPlaylistInfo] = useState<{ url: string; } | null>(null);
  const [activeTab, setActiveTab] = useState("general");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [useXtreamMetadata, setUseXtreamMetadata] = useState(() => {
    return localStorage.getItem("use_xtream_metadata") === "true";
  });
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!m3uService.isAuthenticated()) {
      navigate("/");
      return;
    }
    
    const credentials = m3uService.getCredentials();
    if (credentials) {
      setPlaylistInfo(credentials);
    }
  }, [navigate]);
  
  const handleDisconnect = () => {
    m3uService.clearCredentials();
    xtreamService.clearCredentials();
    localStorage.removeItem("use_xtream_metadata");
    toast.success("Disconnected from playlist");
    navigate("/");
  };
  
  const handleRefreshPlaylist = async () => {
    if (!playlistInfo) return;
    
    setIsRefreshing(true);
    try {
      await m3uService.loadChannels(true); // Now correctly passing true for forceReload
      toast.success("Playlist refreshed successfully");
    } catch (error) {
      console.error("Failed to refresh playlist:", error);
      toast.error("Failed to refresh playlist");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleToggleXtreamMetadata = (checked: boolean) => {
    setUseXtreamMetadata(checked);
    localStorage.setItem("use_xtream_metadata", checked.toString());
    
    toast.success(
      checked 
        ? "Xtream metadata mode enabled" 
        : "Xtream metadata mode disabled", 
      {
        description: checked 
          ? "Using Xtream API for categories and metadata" 
          : "Using M3U playlist for all data"
      }
    );
  };
  
  if (!playlistInfo) {
    return null;
  }
  
  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-primary" />
            <CardTitle>Settings</CardTitle>
          </div>
          <CardDescription>
            Manage your playlist and player settings
          </CardDescription>
        </CardHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <CardContent>
            <TabsList className="mb-4">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="playlist">Playlist</TabsTrigger>
              <TabsTrigger value="about">About</TabsTrigger>
            </TabsList>
            
            <TabsContent value="general">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Player Settings</h3>
                  <p className="text-muted-foreground mb-4">
                    Configure how videos are played in the application
                  </p>
                  
                  <div className="text-sm text-muted-foreground">
                    <p>More player settings coming soon.</p>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Data Source Settings
                  </h3>
                  
                  <div className="flex items-center space-x-2 mb-4">
                    <Switch 
                      id="use-xtream-metadata" 
                      checked={useXtreamMetadata}
                      onCheckedChange={handleToggleXtreamMetadata}
                    />
                    <Label htmlFor="use-xtream-metadata">Use Xtream API for metadata</Label>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    When enabled, Harmony will use the Xtream API for fetching categories and metadata,
                    while still using M3U links for playback. This provides better organization without
                    affecting playback quality.
                  </p>
                  
                  {useXtreamMetadata && !xtreamService.isAuthenticated() && (
                    <div className="mt-4 p-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-md text-sm">
                      <p className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                        Xtream credentials not set
                      </p>
                      <p className="text-yellow-700 dark:text-yellow-300">
                        You need to connect your Xtream account to use this feature.
                        Go to the playlist tab to disconnect and reconnect with Xtream credentials.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="playlist">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Playlist Information</h3>
                  <p className="text-muted-foreground mb-1">Playlist URL:</p>
                  <p className="mb-2 break-all bg-muted p-2 rounded text-sm">
                    {playlistInfo.url}
                  </p>
                </div>
                
                <div className="pt-2 space-y-4">
                  <Button 
                    className="w-full sm:w-auto flex items-center gap-2"
                    onClick={handleRefreshPlaylist}
                    disabled={isRefreshing}
                  >
                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    {isRefreshing ? 'Refreshing...' : 'Refresh Playlist'}
                  </Button>
                  
                  <Button 
                    variant="destructive" 
                    className="w-full sm:w-auto flex items-center gap-2"
                    onClick={handleDisconnect}
                  >
                    <LogOut className="h-4 w-4" />
                    Disconnect Playlist
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="about">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    About Harmony
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Harmony is an IPTV player that supports M3U/M3U8 playlists
                  </p>
                  
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>Version: 1.0.0</p>
                    <p>Built with React, Tailwind CSS, and HLS.js</p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}
