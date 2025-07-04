"""
Advanced Object Tracking and Distance Estimation
Multi-object tracking with Kalman filters and distance estimation
"""

import numpy as np
import cv2
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from scipy.optimize import linear_sum_assignment
import uuid
from config import Config

@dataclass
class Detection:
    bbox: Tuple[float, float, float, float]  # x1, y1, x2, y2
    confidence: float
    class_id: int
    class_name: str
    distance: float

@dataclass
class TrackedObject:
    id: str
    bbox: Tuple[float, float, float, float]
    confidence: float
    class_name: str
    distance: float
    velocity: Tuple[float, float]  # vx, vy in pixels/frame
    age: int
    missed_frames: int
    kalman_filter: cv2.KalmanFilter

class KalmanTracker:
    """Kalman filter for object tracking"""
    
    def __init__(self, bbox: Tuple[float, float, float, float]):
        self.kalman = cv2.KalmanFilter(8, 4)
        self.kalman.measurementMatrix = np.array([
            [1, 0, 0, 0, 0, 0, 0, 0],
            [0, 1, 0, 0, 0, 0, 0, 0],
            [0, 0, 1, 0, 0, 0, 0, 0],
            [0, 0, 0, 1, 0, 0, 0, 0]
        ], np.float32)
        
        self.kalman.transitionMatrix = np.array([
            [1, 0, 0, 0, 1, 0, 0, 0],
            [0, 1, 0, 0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0, 0, 1, 0],
            [0, 0, 0, 1, 0, 0, 0, 1],
            [0, 0, 0, 0, 1, 0, 0, 0],
            [0, 0, 0, 0, 0, 1, 0, 0],
            [0, 0, 0, 0, 0, 0, 1, 0],
            [0, 0, 0, 0, 0, 0, 0, 1]
        ], np.float32)
        
        self.kalman.processNoiseCov = np.eye(8, dtype=np.float32) * 0.03
        self.kalman.measurementNoiseCov = np.eye(4, dtype=np.float32) * 0.1
        
        # Initialize state
        x1, y1, x2, y2 = bbox
        cx, cy, w, h = (x1 + x2) / 2, (y1 + y2) / 2, x2 - x1, y2 - y1
        self.kalman.statePre = np.array([cx, cy, w, h, 0, 0, 0, 0], np.float32)
        self.kalman.statePost = np.array([cx, cy, w, h, 0, 0, 0, 0], np.float32)
        
    def predict(self) -> Tuple[float, float, float, float]:
        """Predict next position"""
        predicted = self.kalman.predict()
        cx, cy, w, h = predicted[0], predicted[1], predicted[2], predicted[3]
        x1, y1, x2, y2 = cx - w/2, cy - h/2, cx + w/2, cy + h/2
        return x1, y1, x2, y2
        
    def update(self, bbox: Tuple[float, float, float, float]):
        """Update with new measurement"""
        x1, y1, x2, y2 = bbox
        cx, cy, w, h = (x1 + x2) / 2, (y1 + y2) / 2, x2 - x1, y2 - y1
        measurement = np.array([cx, cy, w, h], np.float32)
        self.kalman.correct(measurement)

class AdvancedDistanceEstimator:
    """Advanced distance estimation using multiple methods"""
    
    def __init__(self):
        self.config = Config()
        self.calibration_data = {}
        
    def estimate_distance_by_size(self, bbox_width: float, bbox_height: float, 
                                class_name: str) -> float:
        """Estimate distance using apparent size"""
        if class_name not in self.config.OBJECT_REAL_SIZES:
            return -1.0
            
        real_size = self.config.OBJECT_REAL_SIZES[class_name]
        
        # Use the larger dimension for better accuracy
        apparent_size = max(bbox_width, bbox_height)
        
        if apparent_size <= 0:
            return -1.0
            
        distance = (real_size * self.config.CAMERA_FOCAL_LENGTH) / apparent_size
        
        # Apply distance correction based on object type
        if class_name == 'person':
            distance *= 0.9  # People often appear smaller
        elif class_name in ['car', 'truck']:
            distance *= 1.1  # Vehicles often appear larger
            
        return max(0.5, min(distance, 500.0))  # Clamp between 0.5m and 500m
        
    def estimate_distance_by_position(self, bbox: Tuple[float, float, float, float],
                                    frame_height: int) -> float:
        """Estimate distance using vertical position in frame"""
        _, y1, _, y2 = bbox
        obj_bottom = y2
        
        # Objects lower in frame are generally closer
        relative_position = obj_bottom / frame_height
        
        if relative_position > 0.8:  # Bottom of frame
            return 2.0
        elif relative_position > 0.6:
            return 5.0
        elif relative_position > 0.4:
            return 10.0
        else:
            return 20.0

class MultiObjectTracker:
    """Advanced multi-object tracker with Kalman filtering"""
    
    def __init__(self):
        self.config = Config()
        self.tracked_objects: Dict[str, TrackedObject] = {}
        self.distance_estimator = AdvancedDistanceEstimator()
        self.next_id = 0
        self.max_missed_frames = 10
        self.iou_threshold = 0.3
        
    def _calculate_iou(self, box1: Tuple[float, float, float, float],
                      box2: Tuple[float, float, float, float]) -> float:
        """Calculate Intersection over Union"""
        x1_1, y1_1, x2_1, y2_1 = box1
        x1_2, y1_2, x2_2, y2_2 = box2
        
        # Calculate intersection
        x1_i = max(x1_1, x1_2)
        y1_i = max(y1_1, y1_2)
        x2_i = min(x2_1, x2_2)
        y2_i = min(y2_1, y2_2)
        
        if x2_i <= x1_i or y2_i <= y1_i:
            return 0.0
            
        intersection = (x2_i - x1_i) * (y2_i - y1_i)
        
        # Calculate union
        area1 = (x2_1 - x1_1) * (y2_1 - y1_1)
        area2 = (x2_2 - x1_2) * (y2_2 - y1_2)
        union = area1 + area2 - intersection
        
        return intersection / union if union > 0 else 0.0
        
    def update(self, detections: List[Detection], frame_height: int) -> List[TrackedObject]:
        """Update tracker with new detections"""
        # Predict all existing tracks
        predictions = {}
        for obj_id, obj in self.tracked_objects.items():
            predicted_bbox = obj.kalman_filter.predict()
            predictions[obj_id] = predicted_bbox
            
        # Calculate cost matrix for assignment
        if detections and self.tracked_objects:
            cost_matrix = np.zeros((len(self.tracked_objects), len(detections)))
            obj_ids = list(self.tracked_objects.keys())
            
            for i, obj_id in enumerate(obj_ids):
                predicted_bbox = predictions[obj_id]
                for j, detection in enumerate(detections):
                    iou = self._calculate_iou(predicted_bbox, detection.bbox)
                    cost_matrix[i, j] = 1 - iou
                    
            # Hungarian algorithm for optimal assignment
            if cost_matrix.size > 0:
                row_indices, col_indices = linear_sum_assignment(cost_matrix)
                
                # Update matched tracks
                matched_detections = set()
                matched_tracks = set()
                
                for row, col in zip(row_indices, col_indices):
                    if cost_matrix[row, col] < (1 - self.iou_threshold):
                        obj_id = obj_ids[row]
                        detection = detections[col]
                        
                        # Update track
                        obj = self.tracked_objects[obj_id]
                        obj.kalman_filter.update(detection.bbox)
                        obj.bbox = detection.bbox
                        obj.confidence = detection.confidence
                        obj.distance = detection.distance
                        obj.age += 1
                        obj.missed_frames = 0
                        
                        matched_detections.add(col)
                        matched_tracks.add(obj_id)
                
                # Handle unmatched tracks
                for obj_id in self.tracked_objects:
                    if obj_id not in matched_tracks:
                        self.tracked_objects[obj_id].missed_frames += 1
                        
                # Create new tracks for unmatched detections
                for i, detection in enumerate(detections):
                    if i not in matched_detections:
                        self._create_new_track(detection, frame_height)
        else:
            # No existing tracks, create new ones for all detections
            for detection in detections:
                self._create_new_track(detection, frame_height)
                
        # Remove old tracks
        to_remove = []
        for obj_id, obj in self.tracked_objects.items():
            if obj.missed_frames > self.max_missed_frames:
                to_remove.append(obj_id)
                
        for obj_id in to_remove:
            del self.tracked_objects[obj_id]
            
        return list(self.tracked_objects.values())
        
    def _create_new_track(self, detection: Detection, frame_height: int):
        """Create new tracked object"""
        obj_id = str(uuid.uuid4())[:8]
        
        # Enhanced distance estimation
        bbox_width = detection.bbox[2] - detection.bbox[0]
        bbox_height = detection.bbox[3] - detection.bbox[1]
        
        distance_by_size = self.distance_estimator.estimate_distance_by_size(
            bbox_width, bbox_height, detection.class_name)
        distance_by_position = self.distance_estimator.estimate_distance_by_position(
            detection.bbox, frame_height)
            
        # Weighted average of distance estimates
        if distance_by_size > 0:
            final_distance = 0.7 * distance_by_size + 0.3 * distance_by_position
        else:
            final_distance = distance_by_position
            
        tracked_obj = TrackedObject(
            id=obj_id,
            bbox=detection.bbox,
            confidence=detection.confidence,
            class_name=detection.class_name,
            distance=final_distance,
            velocity=(0.0, 0.0),
            age=0,
            missed_frames=0,
            kalman_filter=KalmanTracker(detection.bbox)
        )
        
        self.tracked_objects[obj_id] = tracked_obj 