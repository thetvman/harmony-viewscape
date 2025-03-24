import { useRef, useEffect, useState } from "react";
import Hls from "hls.js";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Volume2, VolumeX, Maximize, Pause, Play, SkipBack, SkipForward, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface VideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  autoPlay?: boolean;
  controls?: boolean;
  className?: string;
}

export default function VideoPlayer({
  src,
  poster,
  title,
  autoPlay = true,
  controls = true,
  className
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [autoplayFailed, setAutoplayFailed] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);

    const handleAutoPlay = () => {
      if (autoPlay) {
        video.play().catch(err => {
          console.error("Autoplay failed:", err);
          setAutoplayFailed(true);
          toast.info("Click play to start streaming", {
            description: "Autoplay is restricted by your browser",
            duration: 5000,
          });
        });
      }
    };

    // Clean up any existing HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const setupHlsStreaming = (sourceUrl: string) => {
      if (Hls.isSupported()) {
        // Create new HLS instance with optimized configuration
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: sourceUrl.includes(".m3u8"),
          debug: false,
          // Direct loading without CORS proxy
          xhrSetup: (xhr, url) => {
            // Add custom headers if needed
            xhr.withCredentials = false; // Important for CORS
          },
        });
        
        hlsRef.current = hls;
        
        hls.loadSource(sourceUrl);
        hls.attachMedia(video);
        
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          console.log("HLS manifest parsed successfully");
          handleAutoPlay();
        });
        
        hls.on(Hls.Events.ERROR, (event, data) => {
          console.warn("HLS error:", data);
          
          if (data.fatal) {
            console.error("Fatal HLS error:", data);
            
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.log("Network error, attempting recovery...");
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.log("Media error, attempting recovery...");
                hls.recoverMediaError();
                break;
              default:
                console.error("Unrecoverable HLS error");
                // Fall back to direct playback as last resort
                tryDirectPlayback();
                break;
            }
          }
        });
        
        return true;
      }
      
      console.warn("HLS.js is not supported in this browser");
      return false;
    };

    const tryDirectPlayback = () => {
      console.log("Attempting direct video playback");
      video.src = src;
      video.load();
      handleAutoPlay();
      
      // Add error handler for native playback
      const handleError = () => {
        console.error("Native playback error");
        showVlcOption();
      };
      
      video.addEventListener("error", handleError);
      
      return () => {
        video.removeEventListener("error", handleError);
      };
    };

    const showVlcOption = () => {
      toast.error("Format not supported", {
        description: "Your browser doesn't support this video format. Try using VLC player instead.",
        action: {
          label: "Use VLC",
          onClick: () => openInVlc(),
        },
        duration: 10000,
      });
    };

    // Try HLS.js first if it's an HLS stream
    if (src.includes(".m3u8") || src.includes(".ts")) {
      if (setupHlsStreaming(src) === false) {
        tryDirectPlayback();
      }
    } else {
      // For other formats, try direct playback
      tryDirectPlayback();
    }

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      
      // Clean up HLS instance on unmount
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src, autoPlay]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const showControlsTemporarily = () => {
      setShowControls(true);
      
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      
      controlsTimeoutRef.current = setTimeout(() => {
        if (isPlaying) {
          setShowControls(false);
        }
      }, 3000);
    };

    const handleMouseMove = () => {
      showControlsTemporarily();
    };

    const handleMouseLeave = () => {
      if (isPlaying && controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = setTimeout(() => {
          setShowControls(false);
        }, 1000);
      }
    };

    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().catch(err => console.error("Play failed:", err));
    } else {
      video.pause();
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    const newMutedState = !isMuted;
    video.muted = newMutedState;
    setIsMuted(newMutedState);
  };

  const handleVolumeChange = (newValue: number[]) => {
    const video = videoRef.current;
    if (!video) return;

    const newVolume = newValue[0];
    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const handleSeek = (newValue: number[]) => {
    const video = videoRef.current;
    if (!video) return;

    const newTime = newValue[0];
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(err => console.error("Exit fullscreen failed:", err));
    } else {
      container.requestFullscreen().catch(err => console.error("Enter fullscreen failed:", err));
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    
    return [
      h > 0 ? h.toString().padStart(2, '0') : null,
      m.toString().padStart(2, '0'),
      s.toString().padStart(2, '0')
    ].filter(Boolean).join(':');
  };

  const skipBackward = () => {
    const video = videoRef.current;
    if (!video) return;
    
    video.currentTime = Math.max(0, video.currentTime - 10);
  };

  const skipForward = () => {
    const video = videoRef.current;
    if (!video) return;
    
    video.currentTime = Math.min(video.duration, video.currentTime + 10);
  };

  const openInVlc = () => {
    try {
      const vlcUrl = `vlc://${src}`;
      window.location.href = vlcUrl;
      
      toast.info("Opening in VLC", {
        description: "If VLC doesn't open automatically, you may need to install it or set it as the default application.",
        duration: 5000
      });
    } catch (error) {
      console.error("Error opening VLC:", error);
      toast.error("Failed to open VLC", {
        description: "Make sure VLC is installed on your device.",
        action: {
          label: "Download VLC",
          onClick: () => window.open("https://www.videolan.org/vlc/", "_blank")
        }
      });
    }
  };

  return (
    <Card 
      ref={containerRef}
      className={cn(
        "relative overflow-hidden rounded-lg bg-black aspect-video", 
        className
      )}
    >
      <video
        ref={videoRef}
        poster={poster}
        className="w-full h-full object-contain"
        playsInline
        onClick={togglePlay}
      />
      
      {autoplayFailed && !isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50" onClick={togglePlay}>
          <Button 
            variant="outline" 
            size="lg" 
            className="rounded-full w-16 h-16 flex items-center justify-center"
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
          >
            <Play className="h-8 w-8" />
          </Button>
        </div>
      )}
      
      {controls && showControls && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex flex-col justify-end p-4 transition-opacity duration-300">
          {title && (
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-white text-lg font-medium">{title}</h3>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 flex items-center gap-1 text-xs"
                onClick={openInVlc}
              >
                <ExternalLink className="h-3 w-3" />
                Open in VLC
              </Button>
            </div>
          )}
          
          <div className="flex items-center gap-2 mb-2">
            <span className="text-white text-sm">
              {formatTime(currentTime)}
            </span>
            
            <Slider
              value={[currentTime]}
              min={0}
              max={duration || 100}
              step={1}
              onValueChange={handleSeek}
              className="flex-1"
            />
            
            <span className="text-white text-sm">
              {formatTime(duration)}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={togglePlay}
                className="h-8 w-8 text-white hover:bg-white/20"
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5" />
                )}
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={skipBackward}
                className="h-8 w-8 text-white hover:bg-white/20"
              >
                <SkipBack className="h-5 w-5" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={skipForward}
                className="h-8 w-8 text-white hover:bg-white/20"
              >
                <SkipForward className="h-5 w-5" />
              </Button>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleMute}
                  className="h-8 w-8 text-white hover:bg-white/20"
                >
                  {isMuted ? (
                    <VolumeX className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </Button>
                
                <Slider
                  value={[isMuted ? 0 : volume]}
                  min={0}
                  max={1}
                  step={0.01}
                  onValueChange={handleVolumeChange}
                  className="w-24"
                />
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              className="h-8 w-8 text-white hover:bg-white/20"
            >
              <Maximize className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
