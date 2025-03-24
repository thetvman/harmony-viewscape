
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { xtreamService } from "@/services/xtreamService";
import { XtreamCategory, XtreamMovie } from "@/types/iptv";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import VideoPlayer from "@/components/videoplayer/VideoPlayer";
import { Loader2, Search, Film, Info } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const Movies = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<XtreamCategory[]>([]);
  const [movies, setMovies] = useState<XtreamMovie[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedMovie, setSelectedMovie] = useState<XtreamMovie | null>(null);
  const [movieInfo, setMovieInfo] = useState<XtreamMovie | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);
  
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
        const fetchedCategories = await xtreamService.getMovieCategories();
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
    const loadMovies = async () => {
      if (!selectedCategory) return;
      
      try {
        setIsLoading(true);
        const fetchedMovies = await xtreamService.getMovies(selectedCategory);
        setMovies(fetchedMovies);
        setCurrentPage(1);
      } catch (error) {
        console.error("Failed to load movies:", error);
        toast.error("Failed to load movies");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadMovies();
  }, [selectedCategory]);
  
  // Filter movies based on search query
  const filteredMovies = movies.filter(movie => 
    movie.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Calculate pagination
  const totalPages = Math.ceil(filteredMovies.length / itemsPerPage);
  const currentMovies = filteredMovies.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSelectedMovie(null);
  };
  
  const handleMovieClick = (movie: XtreamMovie) => {
    setSelectedMovie(movie);
  };
  
  const handleInfoClick = async (movie: XtreamMovie, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const info = await xtreamService.getMovieInfo(movie.stream_id);
      setMovieInfo(info);
      setInfoDialogOpen(true);
    } catch (error) {
      console.error("Failed to load movie info:", error);
      toast.error("Failed to load movie info");
    }
  };
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  const getStreamUrl = (movie: XtreamMovie) => {
    return xtreamService.getStreamUrl(movie.stream_id, 'movie', movie.container_extension);
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
            <Film className="h-5 w-5" />
            <span>Movies</span>
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
          {selectedMovie && (
            <VideoPlayer
              src={getStreamUrl(selectedMovie)}
              title={selectedMovie.name}
              className="w-full aspect-video"
            />
          )}
          
          {/* Search and filters */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search movies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Movies grid */}
          {isLoading && movies.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {currentMovies.map((movie) => (
                  <Card
                    key={movie.stream_id}
                    className={`hover-scale cursor-pointer media-card overflow-hidden h-full ${
                      selectedMovie?.stream_id === movie.stream_id
                        ? "ring-2 ring-primary"
                        : ""
                    }`}
                    onClick={() => handleMovieClick(movie)}
                  >
                    <div className="relative aspect-[2/3] bg-muted overflow-hidden">
                      {movie.stream_icon ? (
                        <img
                          src={movie.stream_icon}
                          alt={movie.name}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/placeholder.svg";
                          }}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full bg-muted">
                          <Film className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                      <Button
                        size="icon"
                        variant="secondary"
                        className="absolute top-2 right-2 h-8 w-8 rounded-full opacity-80 hover:opacity-100"
                        onClick={(e) => handleInfoClick(movie, e)}
                      >
                        <Info className="h-4 w-4" />
                      </Button>
                    </div>
                    <CardContent className="media-card-content">
                      <h3 className="font-medium line-clamp-1">{movie.name}</h3>
                      {movie.releasedate && (
                        <p className="text-xs text-muted-foreground">
                          {new Date(movie.releasedate).getFullYear()}
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
      
      {/* Movie Info Dialog */}
      <Dialog open={infoDialogOpen} onOpenChange={setInfoDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{movieInfo?.name}</DialogTitle>
            <DialogDescription>
              {movieInfo?.releasedate && (
                <span>
                  {new Date(movieInfo.releasedate).getFullYear()}
                </span>
              )}
              {movieInfo?.genre && (
                <span> • {movieInfo.genre}</span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1">
              {movieInfo?.stream_icon ? (
                <img
                  src={movieInfo.stream_icon}
                  alt={movieInfo.name}
                  className="w-full aspect-[2/3] object-cover rounded-md"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/placeholder.svg";
                  }}
                />
              ) : (
                <div className="w-full aspect-[2/3] bg-muted flex items-center justify-center rounded-md">
                  <Film className="h-10 w-10 text-muted-foreground" />
                </div>
              )}
            </div>
            
            <div className="col-span-2 space-y-4">
              {movieInfo?.plot && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Plot</h4>
                  <p className="text-sm text-muted-foreground">
                    {movieInfo.plot}
                  </p>
                </div>
              )}
              
              {movieInfo?.director && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Director</h4>
                  <p className="text-sm text-muted-foreground">
                    {movieInfo.director}
                  </p>
                </div>
              )}
              
              {movieInfo?.actors && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Cast</h4>
                  <p className="text-sm text-muted-foreground">
                    {movieInfo.actors}
                  </p>
                </div>
              )}
              
              {movieInfo?.rating && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Rating</h4>
                  <p className="text-sm text-muted-foreground">
                    {movieInfo.rating} / 10
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {movieInfo?.youtube_trailer && (
            <div className="mt-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  const trailerUrl = movieInfo.youtube_trailer.includes('youtube.com')
                    ? movieInfo.youtube_trailer
                    : `https://www.youtube.com/watch?v=${movieInfo.youtube_trailer}`;
                  window.open(trailerUrl, '_blank');
                }}
              >
                Watch Trailer
              </Button>
            </div>
          )}
          
          <div className="flex justify-end gap-2 mt-4">
            <Button
              onClick={() => {
                if (movieInfo) {
                  setSelectedMovie(movieInfo);
                  setInfoDialogOpen(false);
                }
              }}
            >
              Play Movie
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Movies;
