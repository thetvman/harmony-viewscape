
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Loader2, Tv, Search } from "lucide-react";
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
  const [searchQuery, setSearchQuery] = useState("");
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
  
  const filteredGroups = Object.entries(channelGroups).reduce<Record<string, Channel[]>>(
    (acc, [group, channels]) => {
      if (searchQuery) {
        const filtered = channels.filter(channel => 
          channel.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        if (filtered.length > 0) {
          acc[group] = filtered;
        }
      } else {
        acc[group] = channels;
      }
      return acc;
    },
    {}
  );
  
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
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Tv className="h-4 w-4" />
          Channels
        </CardTitle>
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search channels..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </CardHeader>
      <Tabs value={activeGroup} onValueChange={setActiveGroup}>
        <CardContent className="p-4 pt-0">
          <TabsList className="w-full justify-start overflow-auto py-1 h-auto">
            {Object.keys(filteredGroups).map(group => (
              <TabsTrigger 
                key={group} 
                value={group}
                className="whitespace-nowrap"
              >
                {group}
              </TabsTrigger>
            ))}
          </TabsList>
        </CardContent>
        
        {Object.entries(filteredGroups).map(([group, channels]) => (
          <TabsContent key={group} value={group} className="m-0">
            <ScrollArea className="h-[calc(100vh-260px)]">
              <div className="p-4 space-y-1">
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
