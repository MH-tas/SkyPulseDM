"""
Professional High-Performance Drone Vision System
Real-time object detection, tracking, and distance estimation
Optimized for RTX 2080 GPU - Target: 60+ FPS
"""

import cv2
import torch
import numpy as np
import threading
import queue
import time
from typing import List, Optional, Tuple
from ultralytics import YOLO
import logging
from pathlib import Path

from config import Config
from performance_optimizer import PerformanceOptimizer, FrameBuffer, FPSCounter
from object_tracker import MultiObjectTracker, Detection

class ProfessionalDroneVisionSystem:
    """
    Professional-grade drone vision system with high-performance processing
    """
    
    def __init__(self, model_path: Optional[str] = None):
        self.config = Config()
        self.logger = self._setup_logging()
        
        # Initialize performance optimizer
        self.optimizer = PerformanceOptimizer()
        
        # Initialize model
        self.model = self._load_and_optimize_model(model_path)
        
        # Initialize tracking system
        self.tracker = MultiObjectTracker()
        
        # Initialize performance monitoring
        self.fps_counter = FPSCounter()
        self.frame_buffer = FrameBuffer(self.config.FRAME_BUFFER_SIZE)
        
        # Threading components
        self.frame_queue = queue.Queue(maxsize=5)
        self.result_queue = queue.Queue(maxsize=5)
        self.processing_thread = None
        self.running = False
        
        # Performance metrics
        self.total_frames = 0
        self.detection_count = 0
        self.avg_inference_time = 0
        
        self.logger.info("Professional Drone Vision System initialized successfully")
        
    def _setup_logging(self) -> logging.Logger:
        """Setup professional logging"""
        logging.basicConfig(
            level=getattr(logging, self.config.LOG_LEVEL),
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.StreamHandler(),
                logging.FileHandler('drone_vision.log')
            ]
        )
        return logging.getLogger("DroneVisionPro")
        
    def _load_and_optimize_model(self, model_path: Optional[str]) -> YOLO:
        """Load and optimize YOLO model for maximum performance"""
        try:
            model_file = model_path if model_path else f"{self.config.MODEL_NAME}.pt"
            self.logger.info(f"Loading model: {model_file}")
            
            model = YOLO(model_file)
            
            # Optimize model for inference
            model = self.optimizer.optimize_model(model)
            
            self.logger.info(f"Model loaded and optimized for {self.config.DEVICE}")
            return model
            
        except Exception as e:
            self.logger.error(f"Failed to load model: {e}")
            raise
            
    def _detect_objects(self, frame: np.ndarray) -> List[Detection]:
        """Perform object detection on frame"""
        start_time = time.perf_counter()
        
        # Run inference
        results = self.model(
            frame,
            conf=self.config.CONFIDENCE_THRESHOLD,
            iou=self.config.IOU_THRESHOLD,
            device=self.config.DEVICE,
            half=self.config.HALF_PRECISION,
            verbose=False
        )[0]
        
        # Process detections
        detections = []
        if results.boxes is not None:
            for box in results.boxes:
                # Extract box data
                xyxy = box.xyxy[0].cpu().numpy()
                conf = float(box.conf[0])
                cls_id = int(box.cls[0])
                
                # Filter by target classes
                if cls_id in self.config.TARGET_CLASSES:
                    class_name = self.config.TARGET_CLASSES[cls_id]
                    
                    detection = Detection(
                        bbox=(float(xyxy[0]), float(xyxy[1]), float(xyxy[2]), float(xyxy[3])),
                        confidence=conf,
                        class_id=cls_id,
                        class_name=class_name,
                        distance=0.0  # Will be calculated by tracker
                    )
                    detections.append(detection)
        
        # Update performance metrics
        inference_time = time.perf_counter() - start_time
        self.avg_inference_time = (self.avg_inference_time * 0.9 + inference_time * 0.1)
        
        return detections
        
    def _draw_professional_overlay(self, frame: np.ndarray, tracked_objects: List, 
                                 fps: float) -> np.ndarray:
        """Draw professional overlay with tracking info"""
        overlay = frame.copy()
        h, w = frame.shape[:2]
        
        # Draw tracked objects
        for obj in tracked_objects:
            x1, y1, x2, y2 = [int(coord) for coord in obj.bbox]
            class_name = obj.class_name
            
            # Get color for this class
            color = self.config.CLASS_COLORS.get(class_name, (255, 255, 255))
            
            # Draw bounding box
            cv2.rectangle(overlay, (x1, y1), (x2, y2), color, self.config.BOX_THICKNESS)
            
            # Draw filled background for text
            label = f"{class_name} [{obj.id[:4]}]"
            distance_text = f"{obj.distance:.1f}m"
            conf_text = f"{obj.confidence:.2f}"
            
            # Calculate text size
            (label_w, label_h), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 
                                                   self.config.FONT_SCALE, self.config.FONT_THICKNESS)
            
            # Draw background rectangle
            cv2.rectangle(overlay, (x1, y1 - label_h - 25), (x1 + label_w + 100, y1), color, -1)
            
            # Draw text
            cv2.putText(overlay, label, (x1 + 5, y1 - 15), cv2.FONT_HERSHEY_SIMPLEX,
                       self.config.FONT_SCALE, (0, 0, 0), self.config.FONT_THICKNESS)
            cv2.putText(overlay, distance_text, (x1 + 5, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX,
                       0.4, (0, 0, 0), 1)
            
            # Draw center point
            center_x, center_y = (x1 + x2) // 2, (y1 + y2) // 2
            cv2.circle(overlay, (center_x, center_y), 3, color, -1)
            
            # Alert for close objects
            if obj.distance < self.config.CRITICAL_DISTANCE:
                cv2.rectangle(overlay, (x1-5, y1-5), (x2+5, y2+5), (0, 0, 255), 3)
            elif obj.distance < self.config.WARNING_DISTANCE:
                cv2.rectangle(overlay, (x1-2, y1-2), (x2+2, y2+2), (0, 255, 255), 2)
        
        # Draw professional HUD
        self._draw_hud(overlay, fps, len(tracked_objects))
        
        return overlay
        
    def _draw_hud(self, frame: np.ndarray, fps: float, object_count: int):
        """Draw professional heads-up display"""
        h, w = frame.shape[:2]
        
        # Semi-transparent background for HUD
        hud_bg = np.zeros((120, 300, 3), dtype=np.uint8)
        hud_bg[:] = (30, 30, 30)
        
        # Add HUD info
        info_lines = [
            f"FPS: {fps:.1f}",
            f"Objects: {object_count}",
            f"Inference: {self.avg_inference_time*1000:.1f}ms",
            f"Device: {self.config.DEVICE.upper()}"
        ]
        
        for i, line in enumerate(info_lines):
            cv2.putText(hud_bg, line, (10, 25 + i * 25), cv2.FONT_HERSHEY_SIMPLEX,
                       0.6, (0, 255, 0), 2)
        
        # Overlay HUD on frame
        frame[10:130, 10:310] = cv2.addWeighted(frame[10:130, 10:310], 0.3, hud_bg, 0.7, 0)
        
        # Draw crosshair
        center_x, center_y = w // 2, h // 2
        cv2.line(frame, (center_x - 20, center_y), (center_x + 20, center_y), (0, 255, 0), 2)
        cv2.line(frame, (center_x, center_y - 20), (center_x, center_y + 20), (0, 255, 0), 2)
        
    def _processing_worker(self):
        """Background processing worker thread"""
        while self.running:
            try:
                if not self.frame_queue.empty():
                    frame = self.frame_queue.get(timeout=0.01)
                    
                    # Optimize frame
                    optimized_frame = self.optimizer.optimize_frame(frame)
                    
                    # Detect objects
                    detections = self._detect_objects(optimized_frame)
                    
                    # Update tracker
                    tracked_objects = self.tracker.update(detections, frame.shape[0])
                    
                    # Put result
                    if not self.result_queue.full():
                        self.result_queue.put((frame, tracked_objects))
                        
                    self.detection_count += len(detections)
                    
            except queue.Empty:
                continue
            except Exception as e:
                self.logger.error(f"Processing error: {e}")
                
    def process_video_stream(self, source: int = 0, display: bool = True) -> None:
        """
        Process video stream with multi-threading for maximum performance
        """
        # Initialize video capture
        cap = cv2.VideoCapture(source)
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, self.config.RESIZE_WIDTH)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self.config.RESIZE_HEIGHT)
        cap.set(cv2.CAP_PROP_FPS, self.config.TARGET_FPS)
        cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
        
        if not cap.isOpened():
            raise RuntimeError(f"Failed to open video source: {source}")
            
        self.logger.info(f"Started video processing from source: {source}")
        
        # Start processing thread
        self.running = True
        self.processing_thread = threading.Thread(target=self._processing_worker)
        self.processing_thread.start()
        
        try:
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                    
                # Add frame to processing queue
                if not self.frame_queue.full():
                    self.frame_queue.put(frame)
                
                # Get processed result
                if not self.result_queue.empty():
                    processed_frame, tracked_objects = self.result_queue.get()
                    
                    # Update FPS counter
                    fps = self.fps_counter.update()
                    
                    # Draw overlay
                    display_frame = self._draw_professional_overlay(processed_frame, tracked_objects, fps)
                    
                    if display:
                        cv2.imshow('Professional Drone Vision System', display_frame)
                        
                    self.total_frames += 1
                    
                    # Log performance periodically
                    if self.total_frames % self.config.PERFORMANCE_LOG_INTERVAL == 0:
                        self.logger.info(f"Performance: {fps:.1f} FPS, "
                                       f"{self.detection_count} total detections")
                
                # Exit on 'q' key
                if cv2.waitKey(1) & 0xFF == ord('q'):
                    break
                    
        except KeyboardInterrupt:
            self.logger.info("Interrupted by user")
        finally:
            self._cleanup(cap)
            
    def _cleanup(self, cap):
        """Clean up resources"""
        self.running = False
        if self.processing_thread:
            self.processing_thread.join()
            
        cap.release()
        cv2.destroyAllWindows()
        self.optimizer.cleanup_memory()
        
        self.logger.info("System shutdown complete")

def main():
    """Main entry point"""
    try:
        # Initialize system
        vision_system = ProfessionalDroneVisionSystem()
        
        # Start processing
        vision_system.process_video_stream(source=0, display=True)
        
    except Exception as e:
        logging.error(f"System error: {e}")
        raise

if __name__ == "__main__":
    main() 