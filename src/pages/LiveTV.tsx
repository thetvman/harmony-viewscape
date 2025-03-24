
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { m3uService } from "@/services/m3uService";
import ChannelList from "@/components/playlist/ChannelList";
import VideoPlayer from "@/components/videoplayer/VideoPlayer";
import { Loader2, Tv } from "lucide-react";

interface Channel {
  id: string;
  name: string;
  logo?: string;
  group?: string;
  url: string;
}

export default function LiveTvPage() {
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!m3uService.isAuthenticated()) {
      navigate("/");
      return;
    }
    
    setIsLoading(false);
  }, [navigate]);
  
  const handleSelectChannel = (channel: Channel) => {
    setSelectedChannel(channel);
  };
  
  if (isLoading) {
    return (
      <div className="container py-8 flex items-center justify-center h-[calc(100vh-100px)]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  return (
    <div className="container py-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1">
          <ChannelList 
            onSelectChannel={handleSelectChannel}
            selectedChannelId={selectedChannel?.id}
          />
        </div>
        
        <div className="md:col-span-2">
          {selectedChannel ? (
            <VideoPlayer 
              src={selectedChannel.url}
              poster={selectedChannel.logo}
              title={selectedChannel.name}
              autoPlay={true}
              controls={true}
            />
          ) : (
            <Card className="aspect-video flex items-center justify-center">
              <CardContent className="p-6 text-center">
                <Tv className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-medium mb-2">No Channel Selected</h3>
                <p className="text-muted-foreground">
                  Select a channel from the list to start watching
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
