
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { xtreamService } from "@/services/xtreamService";
import { XtreamCredentials } from "@/types/iptv";
import { Play, Loader2 } from "lucide-react";

export default function PlaylistForm() {
  const [domain, setDomain] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validation
    if (!domain.trim()) {
      toast.error("Please enter a domain");
      return;
    }
    
    if (!username.trim() || !password.trim()) {
      toast.error("Please enter both username and password");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Format domain
      let formattedDomain = domain.trim();
      if (!formattedDomain.startsWith("http")) {
        formattedDomain = `http://${formattedDomain}`;
      }
      
      const credentials: XtreamCredentials = {
        domain: formattedDomain,
        username: username.trim(),
        password: password.trim()
      };
      
      // Set credentials and attempt authentication
      xtreamService.setCredentials(credentials);
      const success = await xtreamService.authenticate();
      
      if (success) {
        toast.success("Successfully connected to playlist");
        window.location.href = "/live"; // Redirect to live TV page
      }
    } catch (error) {
      let message = "Failed to connect to playlist";
      if (error instanceof Error) {
        message = error.message;
      }
      toast.error(message);
      xtreamService.clearCredentials();
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card className="backdrop-blur-card w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="h-5 w-5 text-primary" />
          Connect to Playlist
        </CardTitle>
        <CardDescription>
          Enter your Xtream Codes playlist details from opop.pro
        </CardDescription>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="domain">Domain</Label>
            <Input
              id="domain"
              placeholder="opop.pro"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              placeholder="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
        </CardContent>
        
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>Connect</>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
