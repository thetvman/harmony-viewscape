
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Tv } from "lucide-react";
import { m3uService } from "@/services/m3uService";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface Channel {
  id: string;
  name: string;
  logo?: string;
  group?: string;
  url: string;
}

export interface ChannelListProps {
  onSelectChannel: (channel: Channel) => void;
  selectedChannelId?: string;
}

export default function ChannelList({ onSelectChannel, selectedChannelId }: ChannelListProps) {
  const [channelGroups, setChannelGroups] = useState<Record<string, Channel[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeGroup, setActiveGroup] = useState<string>("");
  const navigate = useNavigate();
  
  useEffect(() => {
    const loadChannels = async () => {
      if (!m3uService.isAuthenticated()) {
        navigate("/");
        return;
      }
      
      setIsLoading(true);
      
      try {
        await m3uService.loadChannels();
        const groups = m3uService.getChannelsByGroup();
        
        setChannelGroups(groups);
        
        // Set the first group as active if there is one
        const groupNames = Object.keys(groups);
        if (groupNames.length > 0 && !activeGroup) {
          setActiveGroup(groupNames[0]);
        }
      } catch (error) {
        console.error("Failed to load channels:", error);
        toast.error("Failed to load channels");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadChannels();
  }, [navigate, activeGroup]);
  
  if (isLoading) {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent className="p-6 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Loading channels...</p>
        </CardContent>
      </Card>
    );
  }
  
  if (Object.keys(channelGroups).length === 0) {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent className="p-6 text-center">
          <Tv className="h-8 w-8 mx-auto mb-2" />
          <p>No channels found in the playlist</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => navigate("/")}
          >
            Connect to a different playlist
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="h-full">
      <Tabs value={activeGroup} onValueChange={setActiveGroup}>
        <TabsList className="w-full justify-start overflow-auto">
          {Object.keys(channelGroups).map(group => (
            <TabsTrigger 
              key={group} 
              value={group}
              className="whitespace-nowrap"
            >
              {group}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {Object.entries(channelGroups).map(([group, channels]) => (
          <TabsContent key={group} value={group} className="m-0">
            <ScrollArea className="h-[calc(100vh-240px)]">
              <div className="p-4 space-y-2">
                {channels.map(channel => (
                  <Button 
                    key={channel.id}
                    variant={selectedChannelId === channel.id ? "default" : "ghost"}
                    className="w-full justify-start h-auto py-2 px-3"
                    onClick={() => onSelectChannel(channel)}
                  >
                    <div className="flex items-center w-full">
                      {channel.logo && (
                        <img 
                          src={channel.logo} 
                          alt={channel.name} 
                          className="w-8 h-8 mr-3 object-contain rounded"
                          onError={(e) => {
                            // Replace broken image with placeholder
                            (e.target as HTMLImageElement).src = '/placeholder.svg';
                          }}
                        />
                      )}
                      {!channel.logo && (
                        <Tv className="w-8 h-8 mr-3" />
                      )}
                      <span className="text-sm text-left truncate">{channel.name}</span>
                    </div>
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        ))}
      </Tabs>
    </Card>
  );
}
