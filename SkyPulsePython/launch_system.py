"""
Professional Drone Vision System Launcher
Performs system checks and launches optimized vision system
"""

import os
import sys
import subprocess
import platform
import torch
import logging
from pathlib import Path

def check_cuda_availability():
    """Check CUDA availability and GPU info"""
    print("=== GPU & CUDA Status ===")
    
    if torch.cuda.is_available():
        device_count = torch.cuda.device_count()
        current_device = torch.cuda.current_device()
        device_name = torch.cuda.get_device_name(current_device)
        
        print(f"✓ CUDA Available: {torch.version.cuda}")
        print(f"✓ GPU Count: {device_count}")
        print(f"✓ Current GPU: {device_name}")
        print(f"✓ GPU Memory: {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB")
        
        # Check if RTX 2080 or better
        if "RTX" in device_name or "GTX 1080" in device_name or "RTX" in device_name:
            print("✓ GPU Suitable for high-performance inference")
        else:
            print("⚠ GPU may not provide optimal performance")
            
        return True
    else:
        print("✗ CUDA not available - will use CPU (much slower)")
        return False

def check_dependencies():
    """Check if all required packages are installed"""
    print("\n=== Dependency Check ===")
    
    required_packages = [
        'ultralytics',
        'torch',
        'torchvision', 
        'cv2',
        'numpy',
        'scipy'
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            if package == 'cv2':
                import cv2
                print(f"✓ OpenCV: {cv2.__version__}")
            elif package == 'ultralytics':
                import ultralytics
                print(f"✓ Ultralytics: {ultralytics.__version__}")
            elif package == 'torch':
                import torch
                print(f"✓ PyTorch: {torch.__version__}")
            elif package == 'torchvision':
                import torchvision
                print(f"✓ TorchVision: {torchvision.__version__}")
            elif package == 'numpy':
                import numpy
                print(f"✓ NumPy: {numpy.__version__}")
            elif package == 'scipy':
                import scipy
                print(f"✓ SciPy: {scipy.__version__}")
                
        except ImportError:
            missing_packages.append(package)
            print(f"✗ Missing: {package}")
    
    if missing_packages:
        print(f"\n⚠ Missing packages: {', '.join(missing_packages)}")
        print("Run: pip install -r requirements.txt")
        return False
    
    print("✓ All dependencies satisfied")
    return True

def optimize_system():
    """Apply system optimizations"""
    print("\n=== System Optimization ===")
    
    # Set environment variables for optimal performance
    os.environ['CUDA_LAUNCH_BLOCKING'] = '0'
    os.environ['TORCH_CUDNN_V8_API_ENABLED'] = '1'
    os.environ['PYTHONUNBUFFERED'] = '1'
    
    # OpenCV optimizations
    try:
        import cv2
        cv2.setUseOptimized(True)
        cv2.setNumThreads(0)  # Use all available threads
        print("✓ OpenCV optimizations applied")
    except:
        print("⚠ Could not apply OpenCV optimizations")
    
    # PyTorch optimizations
    if torch.cuda.is_available():
        torch.backends.cudnn.benchmark = True
        torch.backends.cudnn.deterministic = False
        print("✓ PyTorch CUDA optimizations applied")
    
    print("✓ System optimization complete")

def check_camera(source=0):
    """Check if camera is available"""
    print(f"\n=== Camera Check (Source: {source}) ===")
    
    try:
        import cv2
        cap = cv2.VideoCapture(source)
        
        if cap.isOpened():
            ret, frame = cap.read()
            if ret:
                h, w = frame.shape[:2]
                fps = cap.get(cv2.CAP_PROP_FPS)
                print(f"✓ Camera available: {w}x{h} @ {fps} FPS")
                cap.release()
                return True
            else:
                print("✗ Camera opened but no frame received")
                cap.release()
                return False
        else:
            print(f"✗ Could not open camera source: {source}")
            return False
            
    except Exception as e:
        print(f"✗ Camera check failed: {e}")
        return False

def show_performance_tips():
    """Show performance optimization tips"""
    print("\n=== Performance Tips ===")
    print("• Close unnecessary applications to free GPU memory")
    print("• Ensure adequate cooling for sustained performance")
    print("• Use Windows High Performance power plan")
    print("• Close browser tabs and other GPU-using applications")
    print("• For best performance, run as administrator")

def main():
    """Main launcher function"""
    print("🚁 Professional Drone Vision System Launcher")
    print("=" * 50)
    
    # System information
    print(f"Platform: {platform.system()} {platform.release()}")
    print(f"Python: {sys.version}")
    
    # Run checks
    cuda_ok = check_cuda_availability()
    deps_ok = check_dependencies()
    camera_ok = check_camera(0)
    
    if not deps_ok:
        print("\n❌ Dependencies missing. Please install requirements first.")
        print("Run: pip install -r requirements.txt")
        return False
    
    if not camera_ok:
        print("\n⚠ Camera not available. System will try to proceed anyway.")
    
    # Apply optimizations
    optimize_system()
    
    # Show tips
    show_performance_tips()
    
    # Launch confirmation
    print("\n" + "="*50)
    if cuda_ok:
        print("🚀 System ready for HIGH-PERFORMANCE operation!")
    else:
        print("🐌 System ready for CPU operation (will be slower)")
    
    print("\nPress ENTER to launch the vision system...")
    print("Press Ctrl+C to cancel")
    
    try:
        input()
    except KeyboardInterrupt:
        print("\n❌ Launch cancelled")
        return False
    
    # Launch the main system
    print("\n🚁 Launching Professional Drone Vision System...")
    try:
        from drone_vision_system import main as vision_main
        vision_main()
    except Exception as e:
        print(f"\n❌ Launch failed: {e}")
        return False
    
    return True

if __name__ == "__main__":
    success = main()
    if not success:
        sys.exit(1) 