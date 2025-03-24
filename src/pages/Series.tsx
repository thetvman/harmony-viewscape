
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { m3uService } from "@/services/m3uService";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import VideoPlayer from "@/components/videoplayer/VideoPlayer";
import { Loader2, Search, List, Play } from "lucide-react";
import { toast } from "sonner";
import MediaCard from "@/components/media/MediaCard";
import CategorySidebar from "@/components/media/CategorySidebar";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Channel {
  id: string;
  name: string;
  logo?: string;
  group?: string;
  url: string;
}

// Helper to extract episode information from title
const extractEpisodeInfo = (title: string) => {
  // Match patterns like "S01E01" or "1x01" or "Season 1 Episode 1"
  const seasonEpisodeRegex = /[Ss](\d+)[Ee](\d+)|(\d+)[xX](\d+)|[Ss]eason\s*(\d+)\s*[Ee]pisode\s*(\d+)/;
  const match = title.match(seasonEpisodeRegex);
  
  if (match) {
    const season = match[1] || match[3] || match[5] || '0';
    const episode = match[2] || match[4] || match[6] || '0';
    return { 
      season: parseInt(season, 10), 
      episode: parseInt(episode, 10) 
    };
  }
  
  return null;
}

// Group episodes by series name, removing season/episode info
const groupSeriesEpisodes = (episodes: Channel[]) => {
  const seriesGroups: Record<string, Channel[]> = {};
  
  episodes.forEach(episode => {
    // Try to extract base series name by removing season/episode info
    let seriesName = episode.name;
    
    // Remove common patterns like S01E01, 1x01, etc.
    seriesName = seriesName.replace(/\s*[Ss]\d+[Ee]\d+|\s*\d+[xX]\d+|\s*[Ss]eason\s*\d+\s*[Ee]pisode\s*\d+/g, '');
    
    // Remove trailing dashes, pipes, colons with optional spaces
    seriesName = seriesName.replace(/[\s-|:]+$/, '').trim();
    
    if (!seriesGroups[seriesName]) {
      seriesGroups[seriesName] = [];
    }
    
    seriesGroups[seriesName].push(episode);
  });
  
  // Sort episodes within each series
  Object.keys(seriesGroups).forEach(series => {
    seriesGroups[series].sort((a, b) => {
      const infoA = extractEpisodeInfo(a.name);
      const infoB = extractEpisodeInfo(b.name);
      
      if (infoA && infoB) {
        // Sort by season, then episode
        if (infoA.season !== infoB.season) {
          return infoA.season - infoB.season;
        }
        return infoA.episode - infoB.episode;
      }
      
      // Fallback to name sort if episode info can't be extracted
      return a.name.localeCompare(b.name);
    });
  });
  
  return seriesGroups;
};

const Series = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<string[]>([]);
  const [allSeries, setAllSeries] = useState<Channel[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedSeries, setSelectedSeries] = useState<string | null>(null);
  const [episodes, setEpisodes] = useState<Channel[]>([]);
  const [selectedEpisode, setSelectedEpisode] = useState<Channel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  
  useEffect(() => {
    const loadSeries = async () => {
      if (!m3uService.isAuthenticated()) {
        navigate("/");
        return;
      }
      
      try {
        setIsLoading(true);
        await m3uService.loadChannels();
        
        const seriesGroups = m3uService.getSeriesByGroup();
        const categoryNames = Object.keys(seriesGroups);
        
        setCategories(categoryNames);
        
        // Select the first category by default
        if (categoryNames.length > 0) {
          setSelectedCategory(categoryNames[0]);
          setAllSeries(seriesGroups[categoryNames[0]]);
        }
      } catch (error) {
        console.error("Failed to load series:", error);
        toast.error("Failed to load series");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSeries();
  }, [navigate]);
  
  useEffect(() => {
    if (selectedCategory) {
      const seriesGroups = m3uService.getSeriesByGroup();
      setAllSeries(seriesGroups[selectedCategory] || []);
      setSelectedSeries(null);
      setEpisodes([]);
      setSelectedEpisode(null);
      setCurrentPage(1);
    }
  }, [selectedCategory]);
  
  // Group series when allSeries changes or search query changes
  const seriesGroups = useMemo(() => {
    const filtered = allSeries.filter(series => 
      series.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return groupSeriesEpisodes(filtered);
  }, [allSeries, searchQuery]);
  
  // Get unique series names for display
  const seriesNames = Object.keys(seriesGroups).sort();
  
  // Calculate pagination for series list
  const totalPages = Math.ceil(seriesNames.length / itemsPerPage);
  const currentSeriesNames = seriesNames.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
    setSelectedSeries(null);
    setEpisodes([]);
    setSelectedEpisode(null);
    setCurrentPage(1);
  };
  
  const handleSeriesClick = (seriesName: string) => {
    setSelectedSeries(seriesName);
    setEpisodes(seriesGroups[seriesName] || []);
    setSelectedEpisode(seriesGroups[seriesName]?.[0] || null);
    
    // Scroll to top on mobile
    if (window.innerWidth < 768) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  const handleEpisodeClick = (episode: Channel) => {
    setSelectedEpisode(episode);
  };
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  if (!m3uService.isAuthenticated()) {
    return null; // Will redirect in useEffect
  }
  
  if (isLoading) {
    return (
      <div className="container py-8 flex items-center justify-center h-[calc(100vh-100px)]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  if (categories.length === 0) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="p-6 text-center">
            <List className="h-12 w-12 mx-auto my-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-2">No Series Found</h2>
            <p className="text-muted-foreground mb-4">
              Your playlist doesn't seem to contain any series content.
            </p>
            <Button onClick={() => navigate("/")}>
              Try a Different Playlist
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container py-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left sidebar - Categories */}
        <CategorySidebar
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryClick={handleCategoryClick}
          icon={List}
          title="Series"
        />
        
        {/* Main content area */}
        <div className="flex-1 space-y-4">
          {/* Video player and episode selector */}
          {selectedSeries && selectedEpisode && (
            <div className="space-y-4">
              <VideoPlayer
                src={selectedEpisode.url}
                title={selectedEpisode.name}
                poster={selectedEpisode.logo}
                className="w-full aspect-video rounded-lg overflow-hidden"
              />
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col space-y-3">
                    <div className="flex items-start gap-4">
                      {selectedEpisode.logo && (
                        <img 
                          src={selectedEpisode.logo}
                          alt={selectedEpisode.name}
                          className="w-20 h-auto rounded object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/placeholder.svg";
                          }}
                        />
                      )}
                      <div>
                        <h2 className="text-xl font-semibold mb-1">{selectedSeries}</h2>
                        <p className="text-sm">{selectedEpisode.name}</p>
                        {selectedEpisode.group && (
                          <p className="text-sm text-muted-foreground">{selectedEpisode.group}</p>
                        )}
                      </div>
                    </div>
                    
                    <h3 className="text-md font-medium mt-2">Episodes</h3>
                    <ScrollArea className="h-48">
                      <div className="space-y-1 pr-3">
                        {episodes.map((episode) => (
                          <Button
                            key={episode.id}
                            variant={selectedEpisode.id === episode.id ? "secondary" : "ghost"}
                            className="w-full justify-start text-left h-auto py-2"
                            onClick={() => handleEpisodeClick(episode)}
                          >
                            <div className="flex items-center gap-2">
                              <Play className="h-4 w-4 flex-shrink-0" />
                              <span className="truncate">{episode.name}</span>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* Series grid */}
          <div className="space-y-4">
            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search series..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Series selection */}
            {!selectedSeries && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {currentSeriesNames.map((seriesName) => {
                  // Use the first episode's image as the series image
                  const firstEpisode = seriesGroups[seriesName]?.[0];
                  return (
                    <MediaCard
                      key={seriesName}
                      id={seriesName}
                      name={seriesName}
                      logo={firstEpisode?.logo}
                      isSelected={selectedSeries === seriesName}
                      mediaType="series"
                      onClick={() => handleSeriesClick(seriesName)}
                    />
                  );
                })}
              </div>
            )}
            
            {/* Empty state */}
            {currentSeriesNames.length === 0 && !selectedSeries && (
              <div className="text-center py-12">
                <List className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium">No series found</h3>
                <p className="text-muted-foreground">
                  Try a different category or search term
                </p>
              </div>
            )}
            
            {/* Pagination */}
            {!selectedSeries && totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Series;
