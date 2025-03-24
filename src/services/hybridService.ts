
import { m3uService } from "./m3uService";
import { xtreamService } from "./xtreamService";
import { toast } from "sonner";

// Unified Channel interface
export interface UnifiedChannel {
  id: string;
  name: string;
  logo?: string;
  group?: string;
  url: string;
  streamType: "live" | "movie" | "series";
  xtreamId?: number;
  seriesId?: number;
  seasonNumber?: string;
  episodeNumber?: string;
}

export interface UnifiedCategory {
  id: string;
  name: string;
  type: "live" | "movie" | "series";
}

class HybridService {
  // Get whether to use Xtream API for metadata
  public useXtreamMetadata(): boolean {
    return localStorage.getItem("use_xtream_metadata") === "true" && xtreamService.isAuthenticated();
  }

  // Get channels organized by category
  public async getLiveChannels(): Promise<Record<string, UnifiedChannel[]>> {
    if (this.useXtreamMetadata()) {
      try {
        // Get categories from Xtream API
        const categories = await xtreamService.getLiveCategories();
        const result: Record<string, UnifiedChannel[]> = {};
        
        // For each category, fetch streams
        for (const category of categories) {
          const streams = await xtreamService.getLiveStreams(category.category_id);
          
          if (streams.length > 0) {
            result[category.category_name] = streams.map(stream => ({
              id: stream.stream_id.toString(),
              name: stream.name,
              logo: stream.stream_icon,
              group: category.category_name,
              // Use M3U URL format for playback
              url: xtreamService.getStreamUrl(stream.stream_id, 'live'),
              streamType: "live",
              xtreamId: stream.stream_id
            }));
          }
        }
        
        return result;
      } catch (error) {
        console.error("Error fetching Xtream live channels:", error);
        toast.error("Failed to load Xtream categories. Falling back to M3U data.");
        // Fall back to M3U data
        return m3uService.getChannelsByGroup();
      }
    } else {
      // Use M3U data
      await m3uService.loadChannels();
      return m3uService.getChannelsByGroup();
    }
  }

  // Get movie categories
  public async getMovies(): Promise<Record<string, UnifiedChannel[]>> {
    if (this.useXtreamMetadata()) {
      try {
        // Get categories from Xtream API
        const categories = await xtreamService.getMovieCategories();
        const result: Record<string, UnifiedChannel[]> = {};
        
        // For each category, fetch movies
        for (const category of categories) {
          const movies = await xtreamService.getMovies(category.category_id);
          
          if (movies.length > 0) {
            result[category.category_name] = movies.map(movie => ({
              id: movie.stream_id.toString(),
              name: movie.name,
              logo: movie.stream_icon,
              group: category.category_name,
              // Use M3U URL format for playback
              url: xtreamService.getStreamUrl(movie.stream_id, 'movie'),
              streamType: "movie",
              xtreamId: movie.stream_id
            }));
          }
        }
        
        return result;
      } catch (error) {
        console.error("Error fetching Xtream movies:", error);
        toast.error("Failed to load Xtream movies. Falling back to M3U data.");
        // Fall back to M3U data
        return m3uService.getMoviesByGroup();
      }
    } else {
      // Use M3U data
      await m3uService.loadChannels();
      return m3uService.getMoviesByGroup();
    }
  }

  // Get series data
  public async getSeries(): Promise<Record<string, UnifiedChannel[]>> {
    if (this.useXtreamMetadata()) {
      try {
        // Get categories from Xtream API
        const categories = await xtreamService.getSeriesCategories();
        const result: Record<string, UnifiedChannel[]> = {};
        
        // For each category, fetch series
        for (const category of categories) {
          const seriesList = await xtreamService.getSeries(category.category_id);
          
          if (seriesList.length > 0) {
            result[category.category_name] = seriesList.map(series => ({
              id: series.series_id.toString(),
              name: series.name,
              logo: series.cover,
              group: category.category_name,
              url: "", // Series don't have direct URLs, need to get episodes
              streamType: "series",
              seriesId: series.series_id
            }));
          }
        }
        
        return result;
      } catch (error) {
        console.error("Error fetching Xtream series:", error);
        toast.error("Failed to load Xtream series. Falling back to M3U data.");
        // Fall back to M3U data
        return m3uService.getSeriesByGroup();
      }
    } else {
      // Use M3U data
      await m3uService.loadChannels();
      return m3uService.getSeriesByGroup();
    }
  }

  // Get episodes for a series
  public async getEpisodes(seriesId: number): Promise<Record<string, UnifiedChannel[]>> {
    if (!this.useXtreamMetadata()) {
      return {}; // No direct way to get episodes from M3U
    }
    
    try {
      const seriesInfo = await xtreamService.getSeriesInfo(seriesId);
      const result: Record<string, UnifiedChannel[]> = {};
      
      // Process each season and its episodes
      for (const seasonNumber in seriesInfo.episodes) {
        const season = seriesInfo.seasons[seasonNumber];
        const episodes = seriesInfo.episodes[seasonNumber];
        
        if (episodes && episodes.length > 0) {
          const seasonName = `Season ${season.season_number}`;
          
          result[seasonName] = episodes.map(episode => ({
            id: episode.id,
            name: `E${episode.episode_num}: ${episode.title || 'Episode ' + episode.episode_num}`,
            logo: episode.info?.movie_image || seriesInfo.info.cover,
            group: seasonName,
            url: xtreamService.getStreamUrl(parseInt(episode.id), 'series'),
            streamType: "series",
            xtreamId: parseInt(episode.id),
            seriesId: seriesId,
            seasonNumber: season.season_number,
            episodeNumber: episode.episode_num
          }));
        }
      }
      
      return result;
    } catch (error) {
      console.error("Error fetching episodes:", error);
      toast.error("Failed to load episodes");
      return {};
    }
  }
}

// Export singleton instance
export const hybridService = new HybridService();
