
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
        // Replace .m3u8 with .ts if needed
        const tsUrl = url.replace('.m3u8', '.ts');
        console.log(`Trying TS URL instead: ${tsUrl}`);
        xhr.open('GET', tsUrl, true);
        return;
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
  
  // Add enhanced error handling
  hls.config.enableWorker = true;
  hls.config.fragLoadPolicy = {
    default: {
      retryDelayMs: 1000,
      maxRetryDelayMs: 8000,
      maxTimeToFirstByteMs: 20000,
      maxLoadTimeMs: 20000,
      errorRetry: true,
      timeoutRetry: true,
      maxRetry: 3
    }
  };
}

export function isTsFile(url: string): boolean {
  return url.endsWith('.ts') || url.includes('.ts?');
}

export function createTsSourceBuffer(mediaSource: MediaSource): SourceBuffer | null {
  try {
    // Try different MIME types for TS files
    const mimeTypes = [
      'video/mp2t; codecs="avc1.42E01E, mp4a.40.2"',
      'video/mp2t',
      'video/mpeg',
      'video/mpeg2',
      'video/mp4; codecs="avc1.42E01E, mp4a.40.2"'
    ];
    
    for (const mimeType of mimeTypes) {
      if (MediaSource.isTypeSupported(mimeType)) {
        console.log(`Creating source buffer with MIME type: ${mimeType}`);
        return mediaSource.addSourceBuffer(mimeType);
      }
    }
    
    console.error("No supported MIME type found for TS file");
    return null;
  } catch (error) {
    console.error("Error creating source buffer:", error);
    return null;
  }
}
