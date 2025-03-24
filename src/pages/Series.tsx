
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { xtreamService } from "@/services/xtreamService";
import { XtreamCategory, XtreamSeries, XtreamSeason, XtreamEpisode } from "@/types/iptv";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import VideoPlayer from "@/components/videoplayer/VideoPlayer";
import { Loader2, Search, List, Play, ChevronRight, ListVideo, Check, Eye } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const Series = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<XtreamCategory[]>([]);
  const [seriesList, setSeriesList] = useState<XtreamSeries[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedSeries, setSelectedSeries] = useState<XtreamSeries | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<string | null>(null);
  const [selectedEpisode, setSelectedEpisode] = useState<XtreamEpisode | null>(null);
  const [seasons, setSeasons] = useState<Record<string, XtreamSeason>>({});
  const [episodes, setEpisodes] = useState<Record<string, XtreamEpisode[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [seasonDialogOpen, setSeasonDialogOpen] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  
  useEffect(() => {
    const checkAuth = async () => {
      if (!xtreamService.isAuthenticated()) {
        navigate("/");
        return;
      }
      
      try {
        setIsLoading(true);
        const fetchedCategories = await xtreamService.getSeriesCategories();
        setCategories(fetchedCategories);
        
        // Select the first category by default
        if (fetchedCategories.length > 0) {
          setSelectedCategory(fetchedCategories[0].category_id);
        }
      } catch (error) {
        console.error("Failed to load categories:", error);
        toast.error("Failed to load categories");
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [navigate]);
  
  useEffect(() => {
    const loadSeries = async () => {
      if (!selectedCategory) return;
      
      try {
        setIsLoading(true);
        const fetchedSeries = await xtreamService.getSeries(selectedCategory);
        setSeriesList(fetchedSeries);
        setCurrentPage(1);
      } catch (error) {
        console.error("Failed to load series:", error);
        toast.error("Failed to load series");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSeries();
  }, [selectedCategory]);
  
  // Filter series based on search query
  const filteredSeries = seriesList.filter(series => 
    series.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Calculate pagination
  const totalPages = Math.ceil(filteredSeries.length / itemsPerPage);
  const currentSeries = filteredSeries.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSelectedSeries(null);
    setSelectedSeason(null);
    setSelectedEpisode(null);
  };
  
  const handleSeriesClick = async (series: XtreamSeries) => {
    try {
      setIsLoading(true);
      const info = await xtreamService.getSeriesInfo(series.series_id);
      
      setSelectedSeries(info.info);
      setSeasons(info.seasons);
      
      // Select the first season if available
      const seasonKeys = Object.keys(info.seasons);
      if (seasonKeys.length > 0) {
        setSelectedSeason(seasonKeys[0]);
        
        // Load episodes for the first season
        await loadEpisodesForSeason(series.series_id, seasonKeys[0]);
      }
      
      setSeasonDialogOpen(true);
    } catch (error) {
      console.error("Failed to load series info:", error);
      toast.error("Failed to load series info");
    } finally {
      setIsLoading(false);
    }
  };
  
  const loadEpisodesForSeason = async (seriesId: number, seasonNum: string) => {
    try {
      setIsLoadingEpisodes(true);
      
      const seriesInfo = await xtreamService.getSeriesInfo(seriesId);
      if (seriesInfo.episodes && seriesInfo.episodes[seasonNum]) {
        setEpisodes(prevEpisodes => ({
          ...prevEpisodes,
          [seasonNum]: seriesInfo.episodes[seasonNum] || []
        }));
      } else {
        // Fallback to getEpisodes if episodes not included in seriesInfo
        const allEpisodes = await xtreamService.getEpisodes(seriesId, seasonNum);
        setEpisodes(allEpisodes);
      }
    } catch (error) {
      console.error(`Failed to load episodes for season ${seasonNum}:`, error);
      toast.error(`Failed to load episodes for season ${seasonNum}`);
    } finally {
      setIsLoadingEpisodes(false);
    }
  };
  
  const handleSeasonChange = async (seasonNum: string) => {
    setSelectedSeason(seasonNum);
    
    // If episodes for this season aren't loaded yet, load them
    if (!episodes[seasonNum] || episodes[seasonNum].length === 0) {
      if (selectedSeries) {
        await loadEpisodesForSeason(selectedSeries.series_id, seasonNum);
      }
    }
  };
  
  const handleEpisodeClick = (episode: XtreamEpisode) => {
    setSelectedEpisode(episode);
    setSeasonDialogOpen(false);
  };
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  const getEpisodeStreamUrl = (episode: XtreamEpisode) => {
    return xtreamService.getStreamUrl(parseInt(episode.id), 'series', episode.container_extension);
  };
  
  if (!xtreamService.isAuthenticated()) {
    return null; // Will redirect in useEffect
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left sidebar - Categories */}
        <div className="w-full md:w-64 flex-shrink-0 space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <List className="h-5 w-5" />
            <span>Series</span>
          </h2>
          
          <div className="backdrop-blur-card p-4 h-[70vh] overflow-y-auto">
            {isLoading && categories.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-1">
                {categories.map((category) => (
                  <Button
                    key={category.category_id}
                    variant={selectedCategory === category.category_id ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => handleCategoryClick(category.category_id)}
                  >
                    {category.category_name}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Main content area */}
        <div className="flex-1 space-y-4">
          {/* Video player */}
          {selectedEpisode && (
            <VideoPlayer
              src={getEpisodeStreamUrl(selectedEpisode)}
              title={`${selectedSeries?.name} - ${selectedEpisode.title}`}
              className="w-full aspect-video"
            />
          )}
          
          {/* Search and filters */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search series..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Series grid */}
          {isLoading && seriesList.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {currentSeries.map((series) => (
                  <Card
                    key={series.series_id}
                    className="hover-scale cursor-pointer media-card overflow-hidden h-full"
                    onClick={() => handleSeriesClick(series)}
                  >
                    <div className="relative aspect-[2/3] bg-muted overflow-hidden">
                      {series.cover ? (
                        <img
                          src={series.cover}
                          alt={series.name}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/placeholder.svg";
                          }}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full bg-muted">
                          <List className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <CardContent className="media-card-content">
                      <h3 className="font-medium line-clamp-1">{series.name}</h3>
                      {series.releaseDate && (
                        <p className="text-xs text-muted-foreground">
                          {series.releaseDate}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Seasons and Episodes Dialog */}
      <Dialog open={seasonDialogOpen} onOpenChange={setSeasonDialogOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedSeries?.name}</DialogTitle>
            <DialogDescription>
              {selectedSeries?.genre && (
                <span>{selectedSeries.genre}</span>
              )}
              {selectedSeries?.releaseDate && (
                <span> • {selectedSeries.releaseDate}</span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              {selectedSeries?.cover ? (
                <img
                  src={selectedSeries.cover}
                  alt={selectedSeries.name}
                  className="w-full aspect-[2/3] object-cover rounded-md"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/placeholder.svg";
                  }}
                />
              ) : (
                <div className="w-full aspect-[2/3] bg-muted flex items-center justify-center rounded-md">
                  <List className="h-10 w-10 text-muted-foreground" />
                </div>
              )}
            </div>
            
            <div className="md:col-span-2">
              {selectedSeries?.plot && (
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground">
                    {selectedSeries.plot}
                  </p>
                </div>
              )}
              
              <Tabs 
                value={selectedSeason || undefined}
                onValueChange={handleSeasonChange}
                className="w-full"
              >
                <TabsList className="mb-4 flex flex-wrap">
                  {Object.entries(seasons).map(([seasonNum, season]) => (
                    <TabsTrigger 
                      key={seasonNum} 
                      value={seasonNum}
                      className="flex-grow"
                    >
                      Season {season.season_number}
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                {Object.entries(seasons).map(([seasonNum, season]) => (
                  <TabsContent key={seasonNum} value={seasonNum} className="border rounded-md">
                    <div className="p-4">
                      <h3 className="font-medium mb-4 flex items-center gap-2">
                        <ListVideo className="h-4 w-4" />
                        Episodes
                      </h3>
                      
                      <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                        {isLoadingEpisodes ? (
                          <div className="flex items-center justify-center py-4">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          </div>
                        ) : episodes[seasonNum] && episodes[seasonNum].length > 0 ? (
                          episodes[seasonNum].map((episode) => (
                            <div
                              key={episode.id}
                              className="flex items-center justify-between p-2 hover:bg-accent rounded-md cursor-pointer group"
                              onClick={() => handleEpisodeClick(episode)}
                            >
                              <div className="flex items-center gap-2 flex-1">
                                <div className="font-medium min-w-8 text-center bg-muted rounded-full h-6 w-6 flex items-center justify-center text-xs">
                                  {episode.episode_num}
                                </div>
                                <div className="flex-1 truncate">
                                  <div className="font-medium text-sm">{episode.title}</div>
                                  {episode.info?.duration_secs && (
                                    <div className="text-xs text-muted-foreground">
                                      {Math.floor(episode.info.duration_secs / 60)} min
                                    </div>
                                  )}
                                </div>
                              </div>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Play className="h-4 w-4 text-primary" />
                              </Button>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-4 text-muted-foreground">
                            <p>No episodes found for this season</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Series;
