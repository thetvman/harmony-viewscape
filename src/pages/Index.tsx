
import { Card, CardContent } from "@/components/ui/card";
import M3uPlaylistForm from "@/components/playlist/M3uPlaylistForm";

export default function IndexPage() {
  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <Card className="bg-background/60 backdrop-blur-sm border-none mb-6">
        <CardContent className="p-6 text-center">
          <h1 className="text-3xl font-bold mb-2">Welcome to IPTV Player</h1>
          <p className="text-muted-foreground">
            Connect to your M3U playlist to start streaming
          </p>
        </CardContent>
      </Card>
      
      <M3uPlaylistForm />
    </div>
  );
}
