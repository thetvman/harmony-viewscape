
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Menu, X, Play, Film, Tv, List, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  const location = useLocation();
  
  // Close menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Close menu when window resizes from mobile to desktop
  useEffect(() => {
    if (!isMobile) {
      setMobileMenuOpen(false);
    }
  }, [isMobile]);

  const navItems = [
    { label: "Live TV", icon: <Tv className="w-4 h-4" />, href: "/live" },
    { label: "Movies", icon: <Film className="w-4 h-4" />, href: "/movies" },
    { label: "Series", icon: <List className="w-4 h-4" />, href: "/series" },
    { label: "Settings", icon: <Settings className="w-4 h-4" />, href: "/settings" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b backdrop-blur-md bg-background/80 supports-backdrop-blur:bg-background/60 border-border/40">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link 
            to="/" 
            className="flex items-center gap-2 text-xl font-semibold text-primary transition-opacity hover:opacity-80"
          >
            <Play className="h-6 w-6 text-primary" />
            <span className="hidden sm:inline-block">Harmony</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn("nav-item", {
                "active": location.pathname === item.href,
              })}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Mobile Navigation Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden animate-fade-in">
          <nav className="container py-4 flex flex-col gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn("nav-item", {
                  "active": location.pathname === item.href,
                })}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
