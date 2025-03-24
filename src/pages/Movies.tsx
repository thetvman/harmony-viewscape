
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
import MediaCard from "@/components/media/MediaCard";
import CategorySidebar from "@/components/media/CategorySidebar";

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
      setCurrentPage(1);
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
  };
  
  const handleMovieClick = (movie: Channel) => {
    setSelectedMovie(movie);
    // Scroll to top on mobile
    if (window.innerWidth < 768) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
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
    <div className="container py-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left sidebar - Categories */}
        <CategorySidebar
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryClick={handleCategoryClick}
          icon={Film}
          title="Movies"
        />
        
        {/* Main content area */}
        <div className="flex-1 space-y-4">
          {/* Video player */}
          {selectedMovie && (
            <div className="space-y-4">
              <VideoPlayer
                src={selectedMovie.url}
                title={selectedMovie.name}
                poster={selectedMovie.logo}
                className="w-full aspect-video rounded-lg overflow-hidden"
              />
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {selectedMovie.logo && (
                      <img 
                        src={selectedMovie.logo}
                        alt={selectedMovie.name}
                        className="w-20 h-auto rounded object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/placeholder.svg";
                        }}
                      />
                    )}
                    <div>
                      <h2 className="text-xl font-semibold mb-1">{selectedMovie.name}</h2>
                      {selectedMovie.group && (
                        <p className="text-sm text-muted-foreground">{selectedMovie.group}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {currentMovies.map((movie) => (
              <MediaCard
                key={movie.id}
                id={movie.id}
                name={movie.name}
                logo={movie.logo}
                isSelected={selectedMovie?.id === movie.id}
                mediaType="movie"
                onClick={() => handleMovieClick(movie)}
              />
            ))}
          </div>
          
          {/* Empty state */}
          {currentMovies.length === 0 && (
            <div className="text-center py-12">
              <Film className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium">No movies found</h3>
              <p className="text-muted-foreground">
                Try a different category or search term
              </p>
            </div>
          )}
          
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
