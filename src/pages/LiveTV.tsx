
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
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/3 lg:w-1/4">
          <ChannelList 
            onSelectChannel={handleSelectChannel}
            selectedChannelId={selectedChannel?.id}
          />
        </div>
        
        <div className="md:w-2/3 lg:w-3/4">
          {selectedChannel ? (
            <div className="space-y-4">
              <VideoPlayer 
                src={selectedChannel.url}
                poster={selectedChannel.logo}
                title={selectedChannel.name}
                autoPlay={true}
                controls={true}
              />
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    {selectedChannel.logo && (
                      <img 
                        src={selectedChannel.logo} 
                        alt={selectedChannel.name}
                        className="w-12 h-12 rounded object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder.svg';
                        }}
                      />
                    )}
                    <div>
                      <h2 className="text-xl font-semibold">{selectedChannel.name}</h2>
                      {selectedChannel.group && (
                        <p className="text-sm text-muted-foreground">{selectedChannel.group}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
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
