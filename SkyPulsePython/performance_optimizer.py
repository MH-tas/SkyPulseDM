"""
Performance Optimizer for High-Speed Drone Vision System
Optimizes GPU memory, model inference, and video processing
"""

import torch
import torch.backends.cudnn as cudnn
import gc
import cv2
import numpy as np
from typing import Optional, Tuple
from config import Config

class PerformanceOptimizer:
    def __init__(self):
        self.config = Config()
        self._setup_gpu_optimization()
        self._setup_opencv_optimization()
        
    def _setup_gpu_optimization(self):
        """Configure GPU settings for maximum performance"""
        if torch.cuda.is_available():
            # Enable cuDNN autotuner for optimal performance
            cudnn.benchmark = True
            cudnn.deterministic = False
            
            # Set memory allocation strategy
            torch.cuda.empty_cache()
            torch.cuda.set_per_process_memory_fraction(self.config.CUDA_MEMORY_FRACTION)
            
            # Enable TensorFloat-32 for RTX cards
            torch.backends.cuda.matmul.allow_tf32 = True
            torch.backends.cudnn.allow_tf32 = True
            
            print(f"GPU Optimization enabled for: {torch.cuda.get_device_name()}")
            print(f"CUDA Memory: {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB")
        
    def _setup_opencv_optimization(self):
        """Configure OpenCV for maximum performance"""
        # Enable OpenCV optimizations
        cv2.setUseOptimized(True)
        cv2.setNumThreads(self.config.NUM_WORKERS)
        
        # Use hardware acceleration if available
        try:
            cv2.ocl.setUseOpenCL(True)
        except:
            pass
            
    def optimize_model(self, model):
        """Optimize YOLO model for inference"""
        model.to(self.config.DEVICE)
        
        if self.config.HALF_PRECISION and self.config.DEVICE == "cuda":
            model.half()
            
        # Compile model for faster inference (PyTorch 2.0+)
        try:
            model = torch.compile(model, mode="max-autotune")
        except:
            pass
            
        # Set model to evaluation mode
        model.eval()
        
        # Warm up the model
        dummy_input = torch.randn(1, 3, self.config.MODEL_INPUT_SIZE, 
                                 self.config.MODEL_INPUT_SIZE).to(self.config.DEVICE)
        if self.config.HALF_PRECISION:
            dummy_input = dummy_input.half()
            
        with torch.no_grad():
            for _ in range(3):
                _ = model(dummy_input)
                
        torch.cuda.synchronize()
        return model
        
    def optimize_frame(self, frame: np.ndarray) -> np.ndarray:
        """Optimize frame preprocessing"""
        # Resize frame for processing
        if frame.shape[:2] != (self.config.RESIZE_HEIGHT, self.config.RESIZE_WIDTH):
            frame = cv2.resize(frame, (self.config.RESIZE_WIDTH, self.config.RESIZE_HEIGHT),
                             interpolation=cv2.INTER_LINEAR)
        
        return frame
        
    def cleanup_memory(self):
        """Clean up GPU memory"""
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
            torch.cuda.synchronize()
        gc.collect()

class FrameBuffer:
    """High-performance frame buffer for smooth video processing"""
    
    def __init__(self, buffer_size: int = 3):
        self.buffer_size = buffer_size
        self.frames = []
        self.lock = False
        
    def add_frame(self, frame: np.ndarray) -> bool:
        """Add frame to buffer"""
        if self.lock:
            return False
            
        if len(self.frames) >= self.buffer_size:
            self.frames.pop(0)
            
        self.frames.append(frame.copy())
        return True
        
    def get_latest_frame(self) -> Optional[np.ndarray]:
        """Get the most recent frame"""
        if not self.frames:
            return None
        return self.frames[-1]
        
    def clear_buffer(self):
        """Clear all frames from buffer"""
        self.lock = True
        self.frames.clear()
        self.lock = False

class FPSCounter:
    """Accurate FPS counter with smoothing"""
    
    def __init__(self, window_size: int = 30):
        self.window_size = window_size
        self.frame_times = []
        self.last_time = None
        
    def update(self) -> float:
        """Update FPS counter and return current FPS"""
        import time
        current_time = time.perf_counter()
        
        if self.last_time is not None:
            frame_time = current_time - self.last_time
            self.frame_times.append(frame_time)
            
            if len(self.frame_times) > self.window_size:
                self.frame_times.pop(0)
                
        self.last_time = current_time
        
        if len(self.frame_times) > 5:
            avg_frame_time = sum(self.frame_times) / len(self.frame_times)
            return 1.0 / avg_frame_time if avg_frame_time > 0 else 0
        
        return 0.0 