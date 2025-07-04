# 🚁 SkyPulse Drone Management System

SkyPulse DM is a comprehensive drone control interface that provides real-time telemetry monitoring, flight control, and autonomous mission management capabilities. Built with React + TypeScript + Electron for cross-platform desktop support and Python for advanced drone communication.

## ✨ Features

### 🎛️ Flight Control
- **Real-time Telemetry**: Live altitude, speed, battery, GPS coordinates
- **Manual Control**: Arm/Disarm, Takeoff/Land, Return-to-Launch (RTL)
- **Flight Gauges**: Circular indicators for critical flight data
- **3D Drone Visualization**: Real-time 3D model orientation

### 🗺️ Mission Planning & Mapping
- **Interactive Maps**: Satellite, street, and terrain view options
- **Real-time Tracking**: Live drone position with animated markers
- **Coordinate Display**: Precise GPS coordinate overlay
- **Multi-layer Support**: Customizable map layers with sci-fi themed UI

### 📹 Camera System
- **Live Video Feed**: Real-time camera streaming
- **Camera Selection**: Multiple camera support
- **Performance Monitoring**: Frame rate and resolution display

### 🤖 Autonomous Features
- **Mission Status**: Real-time autonomous mission tracking
- **Object Detection**: YOLO-based computer vision system
- **Performance Optimization**: Adaptive system optimization

### 🔌 Connectivity
- **Serial Communication**: USB/Serial port connection
- **Auto-detection**: Automatic port discovery and connection
- **Real-time Status**: Connection monitoring with visual indicators

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Three.js** for 3D visualization
- **Leaflet** for interactive maps
- **Electron** for desktop application

### Backend/Communication
- **Python 3.8+** for drone communication
- **PyMAVLink** for MAVLink protocol
- **OpenCV** for computer vision
- **YOLO** for object detection

## 📋 Prerequisites

Before installing, make sure you have:

- **Node.js** (v16 or higher)
- **Python** (v3.8 or higher)
- **Git**

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/SkyPulseDM.git
cd SkyPulseDM
```

### 2. Install Frontend Dependencies
```bash
npm install
```

### 3. Install Python Dependencies
```bash
cd SkyPulsePython
pip install -r requirements.txt
cd ..
```

### 4. Download YOLO Models (Optional)
If you want object detection features:
```bash
cd SkyPulsePython
# YOLO models will be downloaded automatically on first run
cd ..
```

## 🎯 Usage

### Development Mode
```bash
# Start the React development server
npm run dev

# In another terminal, start the Python backend
cd SkyPulsePython
python launch_system.py
```

### Production Build
```bash
# Build the React application
npm run build

# Run as Electron app
npm run electron
```

### Desktop Application
```bash
# Build and package as desktop app
npm run electron:build
```

## 🔧 Configuration

### Drone Connection
1. Connect your drone via USB/Serial
2. Launch the application
3. Select the correct COM port
4. Click "Connect" to establish communication

### Camera Setup
1. Connect USB cameras to your computer
2. In the app, go to Camera section
3. Select your camera from the dropdown
4. Video feed should appear automatically

### Python Backend Configuration
Edit `SkyPulsePython/config.py` for:
- Serial port settings
- Camera configurations
- YOLO model parameters
- Performance optimization settings

## 📁 Project Structure

```
SkyPulseDM/
├── src/                    # React frontend source
│   ├── components/         # React components
│   │   ├── 3D/            # 3D visualization
│   │   ├── HUD/           # Heads-up display
│   │   ├── Gauges/        # Flight instruments
│   │   └── ...
│   └── assets/            # Static assets
├── SkyPulsePython/        # Python backend
│   ├── drone_vision_system.py
│   ├── object_tracker.py
│   ├── performance_optimizer.py
│   └── requirements.txt
├── public/                # Public assets
│   ├── drone.glb         # 3D drone model
│   └── ...
└── package.json          # Node.js dependencies
```

## 🎮 Controls

### Flight Controls
- **ARM**: Arm the drone motors
- **DISARM**: Disarm the drone motors
- **TAKEOFF**: Automated takeoff sequence
- **LAND**: Automated landing sequence
- **RTL**: Return to launch position

### Map Controls
- **Zoom**: Mouse wheel or +/- buttons
- **Pan**: Click and drag
- **Layer Switch**: Use layer buttons (Streets/Satellite/Terrain)

## 🐛 Troubleshooting

### Common Issues

#### Connection Problems
- Ensure drone is powered on and connected via USB
- Check if the correct COM port is selected
- Verify driver installation for your flight controller

#### Camera Not Working
- Check camera permissions in your OS
- Ensure camera is not being used by another application
- Try different USB ports

#### Python Dependencies
```bash
# If you encounter Python package issues:
pip install --upgrade pip
pip install -r SkyPulsePython/requirements.txt --force-reinstall
```

#### Build Issues
```bash
# Clear npm cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit your changes: `git commit -m 'Add new feature'`
4. Push to the branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for details.

## 🙏 Acknowledgments

- **MAVLink** protocol for drone communication
- **Leaflet** for mapping capabilities
- **Three.js** for 3D visualization
- **YOLO** for object detection
- **React** and **Electron** communities

## 📞 Support

If you encounter any issues or have questions:

1. Check the troubleshooting section
2. Open an issue on GitHub
3. Contact the development team

---

**Happy Flying! 🚁✨**
