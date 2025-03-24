
import { toast } from "sonner";

export interface M3uPlaylist {
  url: string;
  name?: string;
}

interface Channel {
  id: string;
  name: string;
  logo?: string;
  group?: string;
  url: string;
}

class M3uService {
  private playlist: M3uPlaylist | null = null;
  private channels: Channel[] = [];
  private isLoading = false;
  
  constructor() {
    // Try to load playlist from localStorage on initialization
    const savedPlaylist = localStorage.getItem("m3u_playlist");
    if (savedPlaylist) {
      try {
        this.playlist = JSON.parse(savedPlaylist);
      } catch (error) {
        console.error("Failed to parse saved playlist:", error);
        localStorage.removeItem("m3u_playlist");
      }
    }
  }

  public getPlaylist(): M3uPlaylist | null {
    return this.playlist;
  }

  public setPlaylist(playlist: M3uPlaylist): void {
    this.playlist = playlist;
    localStorage.setItem("m3u_playlist", JSON.stringify(playlist));
    this.channels = []; // Reset channels when setting new playlist
  }

  public clearPlaylist(): void {
    this.playlist = null;
    this.channels = [];
    localStorage.removeItem("m3u_playlist");
  }

  public isAuthenticated(): boolean {
    return !!this.playlist;
  }

  public async loadChannels(): Promise<Channel[]> {
    if (!this.playlist) {
      throw new Error("No playlist URL set");
    }
    
    if (this.channels.length > 0) {
      return this.channels;
    }
    
    if (this.isLoading) {
      return [];
    }
    
    this.isLoading = true;
    
    try {
      // Fetch the m3u8 file content
      const response = await fetch(this.playlist.url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch playlist: ${response.status} ${response.statusText}`);
      }
      
      const content = await response.text();
      this.channels = this.parseM3u8Content(content);
      this.isLoading = false;
      return this.channels;
    } catch (error) {
      this.isLoading = false;
      console.error("Error loading channels:", error);
      
      if (error instanceof Error) {
        toast.error(`Failed to load channels: ${error.message}`);
      } else {
        toast.error("Failed to load channels");
      }
      
      throw error;
    }
  }

  public getChannelsByGroup(): Record<string, Channel[]> {
    const groups: Record<string, Channel[]> = {};
    
    for (const channel of this.channels) {
      const group = channel.group || "Unknown";
      
      if (!groups[group]) {
        groups[group] = [];
      }
      
      groups[group].push(channel);
    }
    
    return groups;
  }

  private parseM3u8Content(content: string): Channel[] {
    const channels: Channel[] = [];
    const lines = content.split("\n");
    
    let currentChannel: Partial<Channel> = {};
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line === "#EXTM3U" || line === "") {
        continue;
      }
      
      if (line.startsWith("#EXTINF:")) {
        // Parse channel info line
        currentChannel = {};
        
        // Extract channel name
        const nameMatch = line.match(/,(.*?)$/);
        if (nameMatch && nameMatch[1]) {
          currentChannel.name = nameMatch[1].trim();
        }
        
        // Extract other attributes if present
        const tvgLogoMatch = line.match(/tvg-logo="([^"]*)"/);
        if (tvgLogoMatch && tvgLogoMatch[1]) {
          currentChannel.logo = tvgLogoMatch[1];
        }
        
        const groupMatch = line.match(/group-title="([^"]*)"/);
        if (groupMatch && groupMatch[1]) {
          currentChannel.group = groupMatch[1];
        } else {
          currentChannel.group = "Unknown";
        }
        
        const idMatch = line.match(/tvg-id="([^"]*)"/);
        if (idMatch && idMatch[1]) {
          currentChannel.id = idMatch[1];
        }
      } else if (line.startsWith("http") && currentChannel.name) {
        // This line contains the stream URL
        currentChannel.url = line;
        currentChannel.id = currentChannel.id || `channel-${channels.length}`;
        
        channels.push(currentChannel as Channel);
        currentChannel = {};
      }
    }
    
    return channels;
  }

  public getChannelById(id: string): Channel | undefined {
    return this.channels.find(channel => channel.id === id);
  }
}

// Export singleton instance
export const m3uService = new M3uService();
