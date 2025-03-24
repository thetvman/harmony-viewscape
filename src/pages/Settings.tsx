
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { xtreamService } from "@/services/xtreamService";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { LogOut, Settings as SettingsIcon } from "lucide-react";

const Settings = () => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({
    domain: "",
    username: "",
    password: ""
  });
  
  useEffect(() => {
    const checkAuth = async () => {
      if (!xtreamService.isAuthenticated()) {
        navigate("/");
        return;
      }
      
      const creds = xtreamService.getCredentials();
      if (creds) {
        setCredentials(creds);
      }
    };
    
    checkAuth();
  }, [navigate]);
  
  const handleLogout = () => {
    xtreamService.clearCredentials();
    toast.success("Logged out successfully");
    navigate("/");
  };
  
  if (!xtreamService.isAuthenticated()) {
    return null; // Will redirect in useEffect
  }
  
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-semibold flex items-center gap-2">
        <SettingsIcon className="h-6 w-6" />
        Settings
      </h1>
      
      <Card className="backdrop-blur-card">
        <CardHeader>
          <CardTitle>Connection Details</CardTitle>
          <CardDescription>
            Your current Xtream Codes playlist connection details
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Domain</p>
            <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
              {credentials.domain}
            </p>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm font-medium">Username</p>
            <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
              {credentials.username}
            </p>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm font-medium">Password</p>
            <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
              {credentials.password.replace(/./g, "•")}
            </p>
          </div>
        </CardContent>
        
        <CardFooter>
          <Button 
            variant="destructive" 
            onClick={handleLogout}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </Button>
        </CardFooter>
      </Card>
      
      <Card className="backdrop-blur-card">
        <CardHeader>
          <CardTitle>About Harmony</CardTitle>
          <CardDescription>
            IPTV player information
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Harmony is an elegant and functional IPTV WebPlayer designed with a focus on user experience and clean aesthetics.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
