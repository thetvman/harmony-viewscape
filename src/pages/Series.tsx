
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { m3uService } from "@/services/m3uService";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import VideoPlayer from "@/components/videoplayer/VideoPlayer";
import { Loader2, Search, List } from "lucide-react";
import { toast } from "sonner";

interface Channel {
  id: string;
  name: string;
  logo?: string;
  group?: string;
  url: string;
}

const Series = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<string[]>([]);
  const [series, setSeries] = useState<Channel[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedSeries, setSelectedSeries] = useState<Channel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  
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
          setSeries(seriesGroups[categoryNames[0]]);
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
      setSeries(seriesGroups[selectedCategory] || []);
    }
  }, [selectedCategory]);
  
  // Filter series based on search query
  const filteredSeries = series.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Calculate pagination
  const totalPages = Math.ceil(filteredSeries.length / itemsPerPage);
  const currentSeries = filteredSeries.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
    setSelectedSeries(null);
    setCurrentPage(1);
  };
  
  const handleSeriesClick = (series: Channel) => {
    setSelectedSeries(series);
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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left sidebar - Categories */}
        <div className="w-full md:w-64 flex-shrink-0 space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <List className="h-5 w-5" />
            <span>Series</span>
          </h2>
          
          <div className="backdrop-blur-card p-4 h-[70vh] overflow-y-auto">
            <div className="space-y-1">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => handleCategoryClick(category)}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Main content area */}
        <div className="flex-1 space-y-4">
          {/* Video player */}
          {selectedSeries && (
            <VideoPlayer
              src={selectedSeries.url}
              title={selectedSeries.name}
              poster={selectedSeries.logo}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {currentSeries.map((item) => (
              <Card
                key={item.id}
                className={`hover-scale cursor-pointer media-card overflow-hidden h-full ${
                  selectedSeries?.id === item.id
                    ? "ring-2 ring-primary"
                    : ""
                }`}
                onClick={() => handleSeriesClick(item)}
              >
                <div className="relative aspect-[2/3] bg-muted overflow-hidden">
                  {item.logo ? (
                    <img
                      src={item.logo}
                      alt={item.name}
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
                  <h3 className="font-medium line-clamp-1">{item.name}</h3>
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
        </div>
      </div>
    </div>
  );
};

export default Series;
