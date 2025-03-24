
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Film, List, Tv } from "lucide-react";

interface MediaCardProps {
  id: string;
  name: string;
  logo?: string;
  isSelected?: boolean;
  mediaType: "movie" | "series" | "channel";
  onClick: () => void;
}

export default function MediaCard({ 
  id, 
  name, 
  logo, 
  isSelected, 
  mediaType, 
  onClick 
}: MediaCardProps) {
  const getIcon = () => {
    switch (mediaType) {
      case "movie":
        return <Film className="h-12 w-12 text-muted-foreground" />;
      case "series":
        return <List className="h-12 w-12 text-muted-foreground" />;
      case "channel":
        return <Tv className="h-12 w-12 text-muted-foreground" />;
      default:
        return <Film className="h-12 w-12 text-muted-foreground" />;
    }
  };

  return (
    <Card
      className={`hover-scale cursor-pointer media-card overflow-hidden h-full ${
        isSelected ? "ring-2 ring-primary" : ""
      }`}
      onClick={onClick}
    >
      <div className="relative aspect-[2/3] bg-muted overflow-hidden">
        {logo ? (
          <img
            src={logo}
            alt={name}
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/placeholder.svg";
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-muted">
            {getIcon()}
          </div>
        )}
      </div>
      <CardContent className="media-card-content">
        <h3 className="font-medium line-clamp-2">{name}</h3>
      </CardContent>
    </Card>
  );
}
