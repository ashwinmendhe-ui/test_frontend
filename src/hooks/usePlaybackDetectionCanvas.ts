import { AIValue } from "@/types/common";
import { useCallback, useEffect, useRef } from "react";

interface DetectionCanvasOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  frameWidth?: number | null;
  frameHeight?: number | null;
}

interface Detection {
  x: number;
  y: number;
  w: number;
  h: number;
  class: string;
  classId?: number;
  classIds?: number[];
  classNames?: string[];
  colors?: string[];
  confidence: number;
  type?: "yolo" | "llm";
  label?: string;
  properties?: Record<string, unknown>;
  color?: string;
  track_id?: number | string;
  object_id?: number | string;
}

export const useDetectionCanvas = ({ videoRef, canvasRef, frameWidth, frameHeight }: DetectionCanvasOptions) => {
  const canvasCtxRef = useRef<CanvasRenderingContext2D | null>(null);

  // Initialize canvas context
  useEffect(() => {
    if (canvasRef.current && !canvasCtxRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        canvasCtxRef.current = ctx;
      }
    }
  }, [canvasRef]);

  // Sync canvas dimensions with video
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    const resizeCanvas = () => {
      // Get the actual display size of the video element
      const rect = video.getBoundingClientRect();
      const displayWidth = rect.width;
      const displayHeight = rect.height;

      if (!displayWidth || !displayHeight) return;

      // Set canvas CSS size to match video display size EXACTLY
      canvas.style.width = `${displayWidth}px`;
      canvas.style.height = `${displayHeight}px`;
      
      // Set canvas internal resolution to match display size
      canvas.width = displayWidth;
      canvas.height = displayHeight;

      // Position canvas to overlay video exactly
      canvas.style.left = `${rect.left - (canvas.parentElement?.getBoundingClientRect().left || 0)}px`;
      canvas.style.top = `${rect.top - (canvas.parentElement?.getBoundingClientRect().top || 0)}px`;
    };

    video.addEventListener("loadedmetadata", resizeCanvas);
    video.addEventListener("resize", resizeCanvas);
    window.addEventListener("resize", resizeCanvas);

    // Use ResizeObserver to detect video size changes
    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(video);

    resizeCanvas();

    return () => {
      video.removeEventListener("loadedmetadata", resizeCanvas);
      video.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("resize", resizeCanvas);
      resizeObserver.disconnect();
    };
  }, [videoRef, canvasRef]);

  // Helper: Get color for class
  const getColorForClass = useCallback((className: string, classId?: number, fallback?: string) => {
    // Ưu tiên classId
    if (classId !== undefined) {
      const aiItem = AIValue.find((ai) => ai.value === classId);
      if (aiItem?.color) return aiItem.color;
    }
    if (className) {
      const aiItem = AIValue.find((ai) => ai.label === className);
      if (aiItem?.color) return aiItem.color;
    }
    return fallback || "#3B82F6";
  }, []);

  // Deduplicate detections - keep only one detection per unique object
  const deduplicateDetections = useCallback((detections: Detection[]): Detection[] => {
    const uniqueDetections: Detection[] = [];
    const seenTrackIds = new Set<string>();

    for (const det of detections) {
      // If detection has track_id/object_id, use that for deduplication
      if (det.track_id !== undefined && det.track_id !== null) {
        const trackKey = `${det.track_id}`;
        if (!seenTrackIds.has(trackKey)) {
          seenTrackIds.add(trackKey);
          uniqueDetections.push(det);
        }
      } else if (det.object_id !== undefined && det.object_id !== null) {
        const trackKey = `${det.object_id}`;
        if (!seenTrackIds.has(trackKey)) {
          seenTrackIds.add(trackKey);
          uniqueDetections.push(det);
        }
      } else {
        // No track_id, check for overlap with existing detections
        const hasOverlap = uniqueDetections.some((existing) => {
          // Calculate IoU (Intersection over Union)
          const x1 = Math.max(det.x, existing.x);
          const y1 = Math.max(det.y, existing.y);
          const x2 = Math.min(det.x + det.w, existing.x + existing.w);
          const y2 = Math.min(det.y + det.h, existing.y + existing.h);

          if (x2 <= x1 || y2 <= y1) return false; // No overlap

          const intersection = (x2 - x1) * (y2 - y1);
          const area1 = det.w * det.h;
          const area2 = existing.w * existing.h;
          const union = area1 + area2 - intersection;
          const iou = union > 0 ? intersection / union : 0;

          // If IoU > 0.5, consider it the same object
          return iou > 0.5;
        });

        if (!hasOverlap) {
          uniqueDetections.push(det);
        }
      }
    }

    return uniqueDetections;
  }, []);

  // Clear canvas
  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvasCtxRef.current;

    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [canvasRef]);

  // Draw detections on canvas
  const drawDetections = useCallback(
    (detections: Detection[]) => {
      const canvas = canvasRef.current;
      const ctx = canvasCtxRef.current;
      const video = videoRef.current;

      if (!canvas || !ctx || !video) return;

      // Clear canvas before drawing
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!detections || detections.length === 0) return;

      // Deduplicate detections
      const uniqueDetections = deduplicateDetections(detections);

      // Get video element dimensions
      const videoRect = video.getBoundingClientRect();
      const containerWidth = videoRect.width;
      const containerHeight = videoRect.height;

      // Get actual video source dimensions
      const videoWidth = video.videoWidth || containerWidth;
      const videoHeight = video.videoHeight || containerHeight;

      // Use frame dimensions from info.json if available (this is the resolution the detections were made at)
      const sourceWidth = frameWidth || videoWidth;
      const sourceHeight = frameHeight || videoHeight;

      // Calculate aspect ratios
      const sourceAspect = sourceWidth / sourceHeight;
      const containerAspect = containerWidth / containerHeight;

      // Calculate the actual rendered video dimensions within the container (object-contain behavior)
      let renderedWidth: number;
      let renderedHeight: number;
      let offsetX = 0;
      let offsetY = 0;

      if (sourceAspect > containerAspect) {
        // Video is wider - fit to container width
        renderedWidth = containerWidth;
        renderedHeight = containerWidth / sourceAspect;
        offsetY = (containerHeight - renderedHeight) / 2;
      } else {
        // Video is taller or equal - fit to container height
        renderedHeight = containerHeight;
        renderedWidth = containerHeight * sourceAspect;
        offsetX = (containerWidth - renderedWidth) / 2;
      }

      // Draw each detection
      uniqueDetections.forEach((det: Detection) => {
        // Detection coordinates are normalized (0-1)
        // Scale them to the rendered video area and add offset
        const x = offsetX + (det.x || 0) * renderedWidth;
        const y = offsetY + (det.y || 0) * renderedHeight;
        const w = (det.w || 0) * renderedWidth;
        const h = (det.h || 0) * renderedHeight;

        const isLlm = det.type === "llm";
        const strokeColor = det.color || getColorForClass(det.class, det.classId);
        const lineWidth = 3;

        ctx.save();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = lineWidth;
        if (isLlm) {
          ctx.setLineDash([5, 5]);
        }
        ctx.strokeRect(x, y, w, h);
        ctx.restore();

        // Draw label for YOLO (normal) detections
        const label = det.label || `${det.class} ${(det.confidence * 100).toFixed(0)}%`;
        if (!isLlm) {
          ctx.save();
          ctx.font = "10px Arial";
          const textWidth = ctx.measureText(label).width;

          ctx.fillStyle = strokeColor;
          ctx.fillRect(x - 1.5, y - 19, textWidth + 10, 18);

          ctx.fillStyle = "#fff";
          ctx.fillText(label, x + 5, y - 6);
          ctx.restore();
        } else {
          // For LLM detections, render each class on separate line with its color
          ctx.save();
          ctx.font = "10px Arial";
          let labelY = y - 6;
          
          // Draw each class name with its corresponding color
          if (det.classNames && det.classNames.length > 0 && det.colors && det.colors.length > 0) {
            det.classNames.forEach((className, index) => {
              const classColor = det.colors![index] || "#FFFFFF";
              ctx.fillStyle = classColor;
              ctx.fillText(className, x, labelY);
              labelY += 14;
            });
          } else {
            // Fallback to single class
            ctx.fillStyle = strokeColor;
            ctx.fillText(label, x, labelY);
            labelY += 14;
          }

          if (det.properties && typeof det.properties === "object") {
            ctx.fillStyle = "#FFFFFF";
            Object.entries(det.properties).forEach(([key, value]) => {
              const text = `${key}: ${value === 1 ? "✓" : value === 0 ? "✗" : value}`;
              ctx.fillText(text, x, labelY);
              labelY += 14;
            });
          }
          ctx.restore();
        }
      });
    },
    [canvasRef, videoRef, frameWidth, frameHeight, deduplicateDetections, getColorForClass]
  );

  return {
    drawDetections,
    clearCanvas,
  };
};
