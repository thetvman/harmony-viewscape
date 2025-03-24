
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { xtreamService } from "@/services/xtreamService";
import PlaylistForm from "@/components/playlist/PlaylistForm";
import { motion } from "framer-motion";

const Index = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // If already authenticated, redirect to live TV page
    if (xtreamService.isAuthenticated()) {
      navigate("/live");
    }
  }, [navigate]);
  
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <h1 className="text-4xl font-bold mb-2 tracking-tight">
          Welcome to <span className="text-primary">Harmony</span>
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Your elegant and intuitive IPTV experience. Connect your playlist to start streaming.
        </p>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="w-full max-w-md"
      >
        <PlaylistForm />
      </motion.div>
    </div>
  );
};

export default Index;
