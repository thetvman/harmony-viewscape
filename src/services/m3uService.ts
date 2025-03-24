import { toast } from "sonner";

interface Channel {
  id: string;
  name: string;
  logo?: string;
  group?: string;
  url: string;
}

interface M3uCredentials {
  url: string;
}

class M3uService {
  private credentials: M3uCredentials | null = null;
  private _channels: Record<string, Channel[]> = {};
  private movies: Record<string, Channel[]> = {};
  private series: Record<string, Channel[]> = {};
  private isLoading: boolean = false;
  
  constructor() {
    // Try to load credentials from localStorage on initialization
    const savedCredentials = localStorage.getItem("m3u_credentials");
    if (savedCredentials) {
      try {
        this.credentials = JSON.parse(savedCredentials);
      } catch (error) {
        console.error("Failed to parse saved credentials:", error);
        localStorage.removeItem("m3u_credentials");
      }
    }
  }
  
  public setCredentials(credentials: M3uCredentials) {
    this.credentials = credentials;
    
    // Save credentials to localStorage
    localStorage.setItem("m3u_credentials", JSON.stringify(credentials));
  }
  
  public getCredentials(): M3uCredentials | null {
    return this.credentials;
  }
  
  public clearCredentials() {
    this.credentials = null;
    localStorage.removeItem("m3u_credentials");
    this._channels = {};
  }
  
  public isAuthenticated(): boolean {
    return !!this.credentials;
  }
  
  public async loadChannels(): Promise<void> {
    if (!this.credentials) {
      throw new Error("M3U URL is required");
    }
    
    if (this.isLoading) {
      return;
    }
    
    this.isLoading = true;
    
    try {
      const response = await fetch(this.credentials.url);
      if (!response.ok) {
        throw new Error(`Failed to fetch M3U file: ${response.status} ${response.statusText}`);
      }
      
      const content = await response.text();
      this.parsePlaylist(content);
      
      toast.success("Playlist loaded successfully!");
    } catch (error) {
      console.error("Error loading M3U playlist:", error);
      this.clearCredentials();
      
      if (error instanceof Error) {
        toast.error(`Failed to load playlist: ${error.message}`);
      } else {
        toast.error("Failed to load playlist");
      }
      
      throw error;
    } finally {
      this.isLoading = false;
    }
  }
  
  public getChannelsByGroup(): Record<string, Channel[]> {
    return this._channels;
  }
  
  public parsePlaylist(content: string): void {
    this._channels = {};
    this.movies = {};
    this.series = {};
    
    const lines = content.split("\n");
    let currentChannel: Partial<Channel> | null = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Parse channel info line
      if (line.startsWith("#EXTINF")) {
        currentChannel = {};
        
        // Parse ID
        const tvgIdMatch = line.match(/tvg-id="([^"]*)"/);
        if (tvgIdMatch && tvgIdMatch[1]) {
          currentChannel.id = tvgIdMatch[1];
        } else {
          currentChannel.id = `channel-${Math.random().toString(36).substring(2, 9)}`;
        }
        
        // Parse logo
        const tvgLogoMatch = line.match(/tvg-logo="([^"]*)"/);
        if (tvgLogoMatch && tvgLogoMatch[1]) {
          currentChannel.logo = tvgLogoMatch[1];
        }
        
        // Parse group
        const groupTitleMatch = line.match(/group-title="([^"]*)"/);
        if (groupTitleMatch && groupTitleMatch[1]) {
          currentChannel.group = groupTitleMatch[1];
        } else {
          currentChannel.group = "Uncategorized";
        }
        
        // Parse name (at the end of the line after the last comma)
        const nameMatch = line.match(/,([^,]*)$/);
        if (nameMatch && nameMatch[1]) {
          currentChannel.name = nameMatch[1].trim();
        } else {
          currentChannel.name = `Unknown Channel ${i}`;
        }
      }
      
      // Parse URL line
      else if (line && !line.startsWith("#") && currentChannel) {
        currentChannel.url = line;
        
        // Add to the appropriate category based on group title or URL
        // Common VOD indicators in group titles
        const isMovie = (currentChannel.group?.toLowerCase().includes('movie') || 
                        currentChannel.group?.toLowerCase().includes('vod')) && 
                        !currentChannel.group?.toLowerCase().includes('series');
                        
        const isSeries = currentChannel.group?.toLowerCase().includes('series');
        
        // Create final channel object
        const channel: Channel = {
          id: currentChannel.id!,
          name: currentChannel.name!,
          url: currentChannel.url,
          group: currentChannel.group,
          logo: currentChannel.logo
        };
        
        // Add to the appropriate collection
        if (isMovie) {
          if (!this.movies[currentChannel.group!]) {
            this.movies[currentChannel.group!] = [];
          }
          this.movies[currentChannel.group!].push(channel);
        }
        else if (isSeries) {
          if (!this.series[currentChannel.group!]) {
            this.series[currentChannel.group!] = [];
          }
          this.series[currentChannel.group!].push(channel);
        }
        else {
          if (!this._channels[currentChannel.group!]) {
            this._channels[currentChannel.group!] = [];
          }
          this._channels[currentChannel.group!].push(channel);
        }
        
        currentChannel = null;
      }
    }
  }
  
  public getMoviesByGroup(): Record<string, Channel[]> {
    return this.movies;
  }
  
  public getSeriesByGroup(): Record<string, Channel[]> {
    return this.series;
  }
}

// Export singleton instance
export const m3uService = new M3uService();
