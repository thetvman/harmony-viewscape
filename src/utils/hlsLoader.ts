
import Hls from 'hls.js';

// Configure enhanced HLS loader settings
export function configureHlsLoader(hls: Hls): void {
  // Set advanced loader configuration
  hls.config.xhrSetup = (xhr, url) => {
    // Disable credentials to prevent CORS preflight issues
    xhr.withCredentials = false;
    
    // Set longer timeout for slow connections
    xhr.timeout = 30000; // 30 seconds
    
    // Add request headers if needed for certain providers
    // xhr.setRequestHeader('X-Custom-Header', 'value');
    
    // Log request for debugging
    console.log(`HLS requesting: ${url}`);
    
    // Check if this is a .ts file instead of .m3u8
    if (url.endsWith('.m3u8') && url.includes('/')) {
      const origUrl = url;
      const host = url.split('/').slice(0, -1).join('/');
      const filename = url.split('/').pop();
      
      if (filename && filename.includes('.')) {
        // Try with .ts extension if server returns 404 for .m3u8
        console.log(`URL might need .ts extension: ${url}`);
      }
    }
  };
  
  // Configure more aggressive recovery options
  hls.config.fragLoadingMaxRetry = 5;
  hls.config.manifestLoadingMaxRetry = 5;
  hls.config.levelLoadingMaxRetry = 5;
  
  // Increase buffer sizes for better playback stability
  hls.config.maxBufferLength = 30;
  hls.config.maxMaxBufferLength = 600;
  hls.config.maxBufferSize = 60 * 1000 * 1000; // 60MB
  
  // Disable low latency mode for better compatibility
  hls.config.lowLatencyMode = false;
  
  // Optimize recovery behavior
  hls.config.maxBufferHole = 0.5;
  hls.config.highBufferWatchdogPeriod = 2;
  hls.config.nudgeOffset = 0.1;
  hls.config.nudgeMaxRetry = 5;
}
