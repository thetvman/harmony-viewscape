import { toast } from "sonner";
import {
  XtreamCredentials,
  XtreamCategory,
  XtreamStream,
  XtreamMovie,
  XtreamSeries,
  XtreamSeason,
  XtreamEpisode
} from "@/types/iptv";

class XtreamService {
  private credentials: XtreamCredentials | null = null;
  private baseUrl: string = "";
  private useTranscoding: boolean = false;
  
  constructor() {
    // Try to load credentials from localStorage on initialization
    const savedCredentials = localStorage.getItem("xtream_credentials");
    if (savedCredentials) {
      try {
        this.credentials = JSON.parse(savedCredentials);
        this.setupBaseUrl();
      } catch (error) {
        console.error("Failed to parse saved credentials:", error);
        localStorage.removeItem("xtream_credentials");
      }
    }
    
    // Load transcoding preference from localStorage
    const transcoding = localStorage.getItem("use_transcoding");
    this.useTranscoding = transcoding === "true";
  }

  private setupBaseUrl() {
    if (!this.credentials) return;
    
    // Format the domain to ensure it starts with http/https and has no trailing slash
    let domain = this.credentials.domain;
    if (!domain.startsWith("http")) {
      domain = `http://${domain}`;
    }
    if (domain.endsWith("/")) {
      domain = domain.slice(0, -1);
    }
    
    this.baseUrl = `${domain}/player_api.php`;
  }

  public setCredentials(credentials: XtreamCredentials) {
    this.credentials = credentials;
    this.setupBaseUrl();
    
    // Save credentials to localStorage
    localStorage.setItem("xtream_credentials", JSON.stringify(credentials));
  }

  public getCredentials(): XtreamCredentials | null {
    return this.credentials;
  }

  public clearCredentials() {
    this.credentials = null;
    this.baseUrl = "";
    localStorage.removeItem("xtream_credentials");
  }

  public isAuthenticated(): boolean {
    return !!this.credentials;
  }

  public toggleTranscoding(enabled: boolean): void {
    this.useTranscoding = enabled;
    localStorage.setItem("use_transcoding", enabled.toString());
    
    toast.info(
      enabled ? "Server-side transcoding enabled" : "Server-side transcoding disabled",
      {
        description: enabled 
          ? "Streams will be converted to a more compatible format" 
          : "Using original stream format",
        duration: 3000
      }
    );
  }
  
  public isTranscodingEnabled(): boolean {
    return this.useTranscoding;
  }

  public getStreamUrl(streamId: number, type: 'live' | 'movie' | 'series', extension: string = 'm3u8'): string {
    if (!this.credentials) {
      throw new Error("Not authenticated");
    }
    
    const { username, password } = this.credentials;
    let domain = this.credentials.domain;
    if (!domain.startsWith("http")) {
      domain = `http://${domain}`;
    }
    if (domain.endsWith("/")) {
      domain = domain.slice(0, -1);
    }
    
    // When transcoding is enabled, use the /play/ endpoint which typically provides 
    // transcoded streams in many Xtream servers
    if (this.useTranscoding) {
      if (type === 'live') {
        return `${domain}/play/${username}/${password}/${streamId}.m3u8`;
      } else if (type === 'movie') {
        return `${domain}/play/${username}/${password}/movie/${streamId}.m3u8`;
      } else {
        return `${domain}/play/${username}/${password}/${type}/${streamId}.m3u8`;
      }
    }
    
    // For direct streaming, now using m3u8 instead of ts for all types
    if (type === 'live') {
      return `${domain}/${username}/${password}/${streamId}.${extension}`;
    } else if (type === 'movie') {
      return `${domain}/${username}/${password}/${type}/${streamId}.${extension}`;
    } else {
      return `${domain}/${username}/${password}/${type}/${streamId}.${extension}`;
    }
  }

  private shouldUseM3u8(streamId: number, type: 'live' | 'movie' | 'series'): boolean {
    // Always return true as we now prefer m3u8 format
    return true;
  }

  private async fetchData<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    if (!this.credentials) {
      throw new Error("Not authenticated");
    }
    
    const { username, password } = this.credentials;
    
    // Combine the base parameters with any additional parameters
    const queryParams = new URLSearchParams({
      username,
      password,
      ...params
    });
    
    const url = `${this.baseUrl}?${queryParams.toString()}`;
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.user_info?.auth === 0) {
        throw new Error("Authentication failed");
      }
      
      return data as T;
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  }

  public async authenticate(): Promise<boolean> {
    try {
      if (!this.credentials) {
        throw new Error("Credentials not set");
      }
      
      const data = await this.fetchData<{ user_info: { auth: number } }>('');
      
      if (data.user_info?.auth === 1) {
        return true;
      } else {
        throw new Error("Authentication failed");
      }
    } catch (error) {
      console.error("Authentication failed:", error);
      this.clearCredentials();
      
      if (error instanceof Error) {
        toast.error(`Authentication failed: ${error.message}`);
      } else {
        toast.error("Authentication failed");
      }
      
      return false;
    }
  }

  // Live TV
  public async getLiveCategories(): Promise<XtreamCategory[]> {
    const data = await this.fetchData<XtreamCategory[]>('', { action: 'get_live_categories' });
    return data;
  }

  public async getLiveStreams(categoryId: string): Promise<XtreamStream[]> {
    const data = await this.fetchData<XtreamStream[]>('', {
      action: 'get_live_streams',
      category_id: categoryId
    });
    return data;
  }

  // Movies
  public async getMovieCategories(): Promise<XtreamCategory[]> {
    const data = await this.fetchData<XtreamCategory[]>('', { action: 'get_vod_categories' });
    return data;
  }

  public async getMovies(categoryId: string): Promise<XtreamMovie[]> {
    const data = await this.fetchData<XtreamMovie[]>('', {
      action: 'get_vod_streams',
      category_id: categoryId
    });
    return data;
  }

  public async getMovieInfo(movieId: number): Promise<XtreamMovie> {
    const data = await this.fetchData<{ info: XtreamMovie }>('', {
      action: 'get_vod_info',
      vod_id: movieId.toString()
    });
    return data.info;
  }

  // Series
  public async getSeriesCategories(): Promise<XtreamCategory[]> {
    const data = await this.fetchData<XtreamCategory[]>('', { action: 'get_series_categories' });
    return data;
  }

  public async getSeries(categoryId: string): Promise<XtreamSeries[]> {
    const data = await this.fetchData<XtreamSeries[]>('', {
      action: 'get_series',
      category_id: categoryId
    });
    return data;
  }

  public async getSeriesInfo(seriesId: number): Promise<{
    info: XtreamSeries, 
    seasons: Record<string, XtreamSeason>,
    episodes: Record<string, XtreamEpisode[]>
  }> {
    try {
      const data = await this.fetchData<{
        info: XtreamSeries, 
        seasons: Record<string, XtreamSeason>,
        episodes: Record<string, XtreamEpisode[]>
      }>('', {
        action: 'get_series_info',
        series_id: seriesId.toString()
      });
      
      return {
        info: data.info,
        seasons: data.seasons,
        episodes: data.episodes || {}
      };
    } catch (error) {
      console.error("Error fetching series info:", error);
      throw error;
    }
  }

  public async getEpisodes(seriesId: number, seasonNumber: string): Promise<Record<string, XtreamEpisode[]>> {
    const data = await this.fetchData<{episodes: Record<string, XtreamEpisode[]>}>('', {
      action: 'get_series_info',
      series_id: seriesId.toString()
    });
    return data.episodes || {};
  }
}

// Export singleton instance
export const xtreamService = new XtreamService();
