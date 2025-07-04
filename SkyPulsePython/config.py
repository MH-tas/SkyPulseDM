"""
Advanced Drone Vision System Configuration
High-performance real-time object detection and tracking
"""

import torch

class Config:
    # Model Configuration
    MODEL_NAME = "yolov8n"  # Using nano version for maximum speed
    MODEL_INPUT_SIZE = 640
    CONFIDENCE_THRESHOLD = 0.4
    IOU_THRESHOLD = 0.45
    MAX_DETECTIONS = 100
    
    # Performance Settings
    TARGET_FPS = 60
    BATCH_SIZE = 1
    NUM_WORKERS = 4
    HALF_PRECISION = True  # FP16 for RTX 2080
    
    # GPU Settings
    DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
    CUDA_MEMORY_FRACTION = 0.8
    
    # Video Processing
    FRAME_BUFFER_SIZE = 3
    SKIP_FRAMES = 0  # Process every frame
    RESIZE_WIDTH = 1280
    RESIZE_HEIGHT = 720
    
    # Distance Estimation Parameters
    CAMERA_FOCAL_LENGTH = 800  # pixels
    OBJECT_REAL_SIZES = {
        'person': 1.7,      # meters (average height)
        'car': 4.5,         # meters (average length)
        'truck': 12.0,      # meters
        'bus': 12.0,        # meters
        'motorcycle': 2.0,  # meters
        'bicycle': 1.8,     # meters
    }
    
    # Classes of Interest (COCO dataset indices)
    TARGET_CLASSES = {
        0: 'person',
        1: 'bicycle',
        2: 'car',
        3: 'motorcycle',
        5: 'bus',
        7: 'truck'
    }
    
    # Visualization
    BOX_THICKNESS = 2
    FONT_SCALE = 0.6
    FONT_THICKNESS = 2
    
    # Colors for different classes (BGR format)
    CLASS_COLORS = {
        'person': (0, 255, 0),      # Green
        'car': (255, 0, 0),         # Blue
        'truck': (0, 0, 255),       # Red
        'bus': (255, 255, 0),       # Cyan
        'motorcycle': (255, 0, 255), # Magenta
        'bicycle': (0, 255, 255)    # Yellow
    }
    
    # Logging
    LOG_LEVEL = "INFO"
    PERFORMANCE_LOG_INTERVAL = 100  # frames
    
    # Safety and Alerts
    CRITICAL_DISTANCE = 5.0  # meters
    WARNING_DISTANCE = 10.0  # meters 