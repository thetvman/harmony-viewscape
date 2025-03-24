
import React from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Folder, LucideIcon } from "lucide-react";

interface CategorySidebarProps {
  categories: string[];
  selectedCategory: string;
  onCategoryClick: (category: string) => void;
  icon?: LucideIcon;
  title: string;
}

export default function CategorySidebar({
  categories,
  selectedCategory,
  onCategoryClick,
  icon: Icon = Folder,
  title
}: CategorySidebarProps) {
  return (
    <div className="w-full md:w-64 flex-shrink-0 space-y-4">
      <h2 className="text-xl font-semibold flex items-center gap-2">
        {Icon && <Icon className="h-5 w-5" />}
        <span>{title}</span>
      </h2>
      
      <div className="backdrop-blur-card p-4 h-[70vh] overflow-y-auto">
        <ScrollArea className="h-full">
          <div className="space-y-1 pr-3">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => onCategoryClick(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
