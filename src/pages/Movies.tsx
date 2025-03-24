
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { m3uService } from "@/services/m3uService";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import VideoPlayer from "@/components/videoplayer/VideoPlayer";
import { Loader2, Search, Film } from "lucide-react";
import { toast } from "sonner";

interface Channel {
  id: string;
  name: string;
  logo?: string;
  group?: string;
  url: string;
}

const Movies = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<string[]>([]);
  const [movies, setMovies] = useState<Channel[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedMovie, setSelectedMovie] = useState<Channel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  
  useEffect(() => {
    const loadMovies = async () => {
      if (!m3uService.isAuthenticated()) {
        navigate("/");
        return;
      }
      
      try {
        setIsLoading(true);
        await m3uService.loadChannels();
        
        const movieGroups = m3uService.getMoviesByGroup();
        const categoryNames = Object.keys(movieGroups);
        
        setCategories(categoryNames);
        
        // Select the first category by default
        if (categoryNames.length > 0) {
          setSelectedCategory(categoryNames[0]);
          setMovies(movieGroups[categoryNames[0]]);
        }
      } catch (error) {
        console.error("Failed to load movies:", error);
        toast.error("Failed to load movies");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadMovies();
  }, [navigate]);
  
  useEffect(() => {
    if (selectedCategory) {
      const movieGroups = m3uService.getMoviesByGroup();
      setMovies(movieGroups[selectedCategory] || []);
    }
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
  
  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
    setSelectedMovie(null);
    setCurrentPage(1);
  };
  
  const handleMovieClick = (movie: Channel) => {
    setSelectedMovie(movie);
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
            <Film className="h-12 w-12 mx-auto my-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-2">No Movies Found</h2>
            <p className="text-muted-foreground mb-4">
              Your playlist doesn't seem to contain any movie content.
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
            <Film className="h-5 w-5" />
            <span>Movies</span>
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
          {selectedMovie && (
            <VideoPlayer
              src={selectedMovie.url}
              title={selectedMovie.name}
              poster={selectedMovie.logo}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {currentMovies.map((movie) => (
              <Card
                key={movie.id}
                className={`hover-scale cursor-pointer media-card overflow-hidden h-full ${
                  selectedMovie?.id === movie.id
                    ? "ring-2 ring-primary"
                    : ""
                }`}
                onClick={() => handleMovieClick(movie)}
              >
                <div className="relative aspect-[2/3] bg-muted overflow-hidden">
                  {movie.logo ? (
                    <img
                      src={movie.logo}
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
                </div>
                <CardContent className="media-card-content">
                  <h3 className="font-medium line-clamp-1">{movie.name}</h3>
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

export default Movies;
