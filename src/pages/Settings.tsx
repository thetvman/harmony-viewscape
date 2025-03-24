
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { m3uService } from "@/services/m3uService";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Play, Settings2, LogOut } from "lucide-react";

export default function SettingsPage() {
  const [playlistInfo, setPlaylistInfo] = useState<{ url: string; name?: string } | null>(null);
  const [activeTab, setActiveTab] = useState("general");
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!m3uService.isAuthenticated()) {
      navigate("/");
      return;
    }
    
    setPlaylistInfo(m3uService.getPlaylist());
  }, [navigate]);
  
  const handleDisconnect = () => {
    m3uService.clearPlaylist();
    toast.success("Disconnected from playlist");
    navigate("/");
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
            </TabsList>
            
            <TabsContent value="general">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Player Settings</h3>
                  <p className="text-muted-foreground mb-4">
                    Configure how videos are played in the application
                  </p>
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
                  
                  {playlistInfo.name && (
                    <>
                      <p className="text-muted-foreground mb-1">Playlist Name:</p>
                      <p className="mb-2 bg-muted p-2 rounded text-sm">
                        {playlistInfo.name}
                      </p>
                    </>
                  )}
                </div>
                
                <div className="pt-4">
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
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}
