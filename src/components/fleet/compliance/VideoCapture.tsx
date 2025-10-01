import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Video, Upload, X, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VideoCaptureProps {
  onVideoChange: (videoUrl: string | null) => void;
  maxSizeMB?: number;
}

export const VideoCapture: React.FC<VideoCaptureProps> = ({
  onVideoChange,
  maxSizeMB = 50,
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith("video/")) {
      toast({
        title: "Invalid File",
        description: "Please select a video file",
        variant: "destructive",
      });
      return;
    }

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      toast({
        title: "File Too Large",
        description: `Video must be smaller than ${maxSizeMB}MB`,
        variant: "destructive",
      });
      return;
    }

    // Create preview URL
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setVideoFile(file);
    onVideoChange(url);

    toast({
      title: "Video Added",
      description: `${file.name} (${fileSizeMB.toFixed(1)}MB)`,
    });
  };

  const handleRemove = () => {
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
    setVideoUrl(null);
    setVideoFile(null);
    onVideoChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="video/*"
        className="hidden"
      />

      {!videoUrl ? (
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-32 border-2 border-dashed"
        >
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Upload Video (Max {maxSizeMB}MB)
            </span>
          </div>
        </Button>
      ) : (
        <Card className="p-2 relative">
          <video
            src={videoUrl}
            controls
            className="w-full h-48 rounded bg-black"
          />
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Video className="h-4 w-4" />
              <span>{videoFile?.name}</span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};
