
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { xtreamService } from "@/services/xtreamService";
import { XtreamCategory, XtreamStream } from "@/types/iptv";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import VideoPlayer from "@/components/videoplayer/VideoPlayer";
import { Loader2, Search, Tv } from "lucide-react";
import { toast } from "sonner";

const LiveTV = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<XtreamCategory[]>([]);
  const [streams, setStreams] = useState<XtreamStream[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedStream, setSelectedStream] = useState<XtreamStream | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 16;
  
  useEffect(() => {
    const checkAuth = async () => {
      if (!xtreamService.isAuthenticated()) {
        navigate("/");
        return;
      }
      
      try {
        setIsLoading(true);
        const fetchedCategories = await xtreamService.getLiveCategories();
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
    const loadStreams = async () => {
      if (!selectedCategory) return;
      
      try {
        setIsLoading(true);
        const fetchedStreams = await xtreamService.getLiveStreams(selectedCategory);
        setStreams(fetchedStreams);
        setCurrentPage(1);
      } catch (error) {
        console.error("Failed to load streams:", error);
        toast.error("Failed to load streams");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadStreams();
  }, [selectedCategory]);
  
  // Filter streams based on search query
  const filteredStreams = streams.filter(stream => 
    stream.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Calculate pagination
  const totalPages = Math.ceil(filteredStreams.length / itemsPerPage);
  const currentStreams = filteredStreams.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSelectedStream(null);
  };
  
  const handleStreamClick = (stream: XtreamStream) => {
    setSelectedStream(stream);
  };
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  const getStreamUrl = (stream: XtreamStream) => {
    return xtreamService.getStreamUrl(stream.stream_id, 'live');
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
            <Tv className="h-5 w-5" />
            <span>Live TV</span>
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
          {selectedStream && (
            <VideoPlayer
              src={getStreamUrl(selectedStream)}
              title={selectedStream.name}
              className="w-full aspect-video"
            />
          )}
          
          {/* Search and filters */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search channels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Streams grid */}
          {isLoading && streams.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {currentStreams.map((stream) => (
                  <Card
                    key={stream.stream_id}
                    className={`hover-scale cursor-pointer media-card ${
                      selectedStream?.stream_id === stream.stream_id
                        ? "ring-2 ring-primary"
                        : ""
                    }`}
                    onClick={() => handleStreamClick(stream)}
                  >
                    <CardContent className="p-4 flex flex-col items-center text-center">
                      {stream.stream_icon ? (
                        <img
                          src={stream.stream_icon}
                          alt={stream.name}
                          className="h-12 w-12 object-contain mb-2"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/placeholder.svg";
                          }}
                        />
                      ) : (
                        <Tv className="h-12 w-12 text-muted-foreground mb-2" />
                      )}
                      <span className="text-sm font-medium line-clamp-2">
                        {stream.name}
                      </span>
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
    </div>
  );
};

export default LiveTV;
