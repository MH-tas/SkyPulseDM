import React, { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import LoadingScreen from './components/Loading/LoadingScreen'
import Header from './components/Layout/Header'
import DroneController from './components/DroneController'
import LiveData from './components/LiveData/LiveData'
import Options from './components/Options/Options'
import ConnectionDialog from './components/ConnectionDialog/ConnectionDialog'
import './components/DroneController.css'
import './App.css'

interface SerialPortInfo {
  path: string;
  manufacturer?: string;
  serialNumber?: string;
  pnpId?: string;
  locationId?: string;
  vendorId?: string;
  productId?: string;
  friendlyName?: string;
  deviceType?: string;
  isKnownTelemetry?: boolean;
}

// Gerçek MAVLink telemetry interface
interface RealTelemetryData {
  altitude: number;
  speed: number;
  battery: number;
  voltage: number;
  current: number;
  gpsLat: number;
  gpsLon: number;
  gpsAlt: number;
  heading: number;
  roll: number;
  pitch: number;
  yaw: number;
  mode: string;
  armed: boolean;
  satellites: number;
  gpsStatus: number;
  groundSpeed: number;
  airSpeed: number;
  climbRate: number;
  throttle: number;
  rssi: number;
  failsafe: boolean;
  systemStatus: number;
  flightMode: number;
  lastHeartbeat: number;
}

type ConnectionState = 'idle' | 'connecting' | 'connected' | 'failed';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [appVisible, setAppVisible] = useState(false);
  const [droneConnected, setDroneConnected] = useState(false);
  const [availablePorts, setAvailablePorts] = useState<SerialPortInfo[]>([]);
  const [selectedPort, setSelectedPort] = useState('');
  const [selectedBaudrate, setSelectedBaudrate] = useState(57600);
  const [connecting, setConnecting] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
  const [connectionProgress, setConnectionProgress] = useState('');
  const [connectionTimeout, setConnectionTimeout] = useState<NodeJS.Timeout | null>(null);
  const [activeTab, setActiveTab] = useState<'main' | 'autonomous' | 'livedata' | 'motor' | 'options'>('main');
  const [connectionMessage, setConnectionMessage] = useState('');
  
  // GPS map state for autonomous tab
  const [mapLayer, setMapLayer] = useState<'streets' | 'satellite' | 'terrain'>('streets');
  
  // Gerçek MAVLink telemetry state
  const [telemetry, setTelemetry] = useState<RealTelemetryData>({
    altitude: 0,
    speed: 0,
    battery: 0,
    voltage: 0,
    current: 0,
    gpsLat: 0,
    gpsLon: 0,
    gpsAlt: 0,
    heading: 0,
    roll: 0,
    pitch: 0,
    yaw: 0,
    mode: 'UNKNOWN',
    armed: false,
    satellites: 0,
    gpsStatus: 0,
    groundSpeed: 0,
    airSpeed: 0,
    climbRate: 0,
    throttle: 0,
    rssi: 0,
    failsafe: false,
    systemStatus: 0,
    flightMode: 0,
    lastHeartbeat: 0
  });

  // Camera state
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);

  // Custom drone icon for Leaflet
  const droneIcon = new L.DivIcon({
    html: `<div style="
      color: #ffaa00; 
      font-size: 28px; 
      text-shadow: 0 0 12px rgba(255, 170, 0, 0.9), 0 0 20px rgba(255, 170, 0, 0.5);
      transform: rotate(${telemetry.heading}deg);
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      background: radial-gradient(circle, rgba(255, 170, 0, 0.2) 0%, transparent 70%);
      border-radius: 50%;
      border: 2px solid rgba(255, 170, 0, 0.3);
    ">✈</div>`,
    className: 'custom-drone-icon',
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  });

  // Map tile URLs function
  const getTileUrl = () => {
    switch (mapLayer) {
      case 'satellite':
        return {
          url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          attribution: '&copy; <a href="https://www.esri.com/">Esri</a> &copy; Airbus DS, USGS, NGA, NASA, CGIAR, N Robinson, NCEAS, NLS, OS, NMA, Geodatastyrelsen, Rijkswaterstaat, GSA, Geoland, FEMA, Intermap and the GIS user community'
        };
      case 'terrain':
        return {
          url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>'
        };
      default: // streets
        return {
          url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        };
    }
  };

  const handleLoadComplete = () => {
    setIsLoading(false);
    
    // Loading screen tamamen kapandıktan sonra ana uygulamayı yumuşak fade in ile göster
    setTimeout(() => {
      setAppVisible(true);
    }, 50); // Çok kısa delay - sadece DOM güncellenmesi için
  };

  const handleConnect = async () => {
    if (!selectedPort) {
      alert('Lütfen bir COM portu seçin');
      return;
    }

    setConnecting(true);
    setConnectionState('connecting');
    setConnectionProgress('Initializing MAVLink connection...');
    setConnectionMessage('Connecting to MAVLink...');
    
    // Connection timeout (30 seconds)
    const timeout = setTimeout(() => {
      handleCancelConnection();
      setConnectionState('failed');
      setConnectionProgress('Connection timeout - No MAVLink response');
      setConnectionMessage('Connection failed: Timeout');
    }, 30000);
    
    setConnectionTimeout(timeout);
    
    if (typeof window !== 'undefined' && window.require) {
      try {
        const { ipcRenderer } = window.require('electron');
        
        // Update progress
        setConnectionProgress('Opening serial port...');
        
        const result = await ipcRenderer.invoke('connect-drone', selectedPort, selectedBaudrate);
        
        if (result.success) {
          setConnectionProgress('Waiting for MAVLink heartbeat...');
          setConnectionMessage('Waiting for telemetry data...');
          // Actual connection status will come from electron IPC
        } else {
          clearTimeout(timeout);
          setConnectionState('failed');
          setConnectionProgress(`Connection failed: ${result.message}`);
          setConnectionMessage('Connection failed');
          setTimeout(() => {
            setConnectionState('idle');
            setConnecting(false);
          }, 3000);
        }
      } catch (error) {
        clearTimeout(timeout);
        setConnectionState('failed');
        setConnectionProgress(`Connection error: ${error}`);
        setConnectionMessage('Connection error');
        setTimeout(() => {
          setConnectionState('idle');
          setConnecting(false);
        }, 3000);
      }
    } else {
      clearTimeout(timeout);
      setConnectionState('failed');
      setConnectionProgress('Electron required for MAVLink connection');
      setConnectionMessage('Electron required');
      setTimeout(() => {
        setConnectionState('idle');
        setConnecting(false);
      }, 3000);
    }
  };

  const handleCancelConnection = async () => {
    if (connectionTimeout) {
      clearTimeout(connectionTimeout);
      setConnectionTimeout(null);
    }
    
    setConnectionProgress('Cancelling connection...');
    
    if (typeof window !== 'undefined' && window.require) {
      try {
        const { ipcRenderer } = window.require('electron');
        await ipcRenderer.invoke('disconnect-drone');
      } catch (error) {
        console.error('Cancel connection error:', error);
      }
    }
    
    setConnectionState('idle');
    setConnecting(false);
    setConnectionProgress('');
    setConnectionMessage('Connection cancelled');
    
    setTimeout(() => {
      setConnectionMessage('');
    }, 2000);
  };

  const handleDisconnect = async () => {
    if (typeof window !== 'undefined' && window.require) {
      try {
        const { ipcRenderer } = window.require('electron');
        const result = await ipcRenderer.invoke('disconnect-drone');
        
        if (result.success) {
    setDroneConnected(false);
          setConnectionMessage(result.message);
        }
      } catch (error) {
        console.error('Disconnect error:', error);
      }
    }
  };

  const handleBaudrateChange = (baudrate: number) => {
    setSelectedBaudrate(baudrate);
  };

  // Electron IPC listeners setup
  useEffect(() => {
    if (typeof window !== 'undefined' && window.require) {
      const { ipcRenderer } = window.require('electron');
      
      // Port güncellemelerini dinle
      const handlePortsUpdate = (event: any, ports: SerialPortInfo[]) => {
        setAvailablePorts(ports);
      };

      // Bağlantı durumu güncellemelerini dinle
      const handleConnectionStatus = (event: any, status: { connected: boolean; message: string }) => {
        setDroneConnected(status.connected);
        setConnectionMessage(status.message);
        
        if (status.connected) {
          // MAVLink heartbeat received - connection successful
          if (connectionTimeout) {
            clearTimeout(connectionTimeout);
            setConnectionTimeout(null);
          }
          
          setConnectionState('connected');
          setConnecting(false);
          setConnectionProgress('MAVLink heartbeat received - Connection established');
          
          // Clear progress after 3 seconds
          setTimeout(() => {
            setConnectionProgress('');
          }, 3000);
          
          console.log('MAVLink connection established:', status.message);
        } else {
          // Connection lost
          if (connectionState === 'connected') {
            setConnectionState('idle');
            setConnectionProgress('MAVLink connection lost');
            
            setTimeout(() => {
              setConnectionProgress('');
            }, 3000);
          }
        }
      };

      // Gerçek telemetry güncellemelerini dinle
      const handleTelemetryUpdate = (event: any, data: RealTelemetryData) => {
        setTelemetry(data);
        
        // Debug: Her telemetry güncellemesini konsola yazdır
        console.log('Telemetry update:', {
          mode: data.mode,
          armed: data.armed,
          altitude: data.altitude,
          speed: data.groundSpeed,
          battery: data.battery,
          satellites: data.satellites,
          gps: `${data.gpsLat}, ${data.gpsLon}`
        });
      };
      
      // İlk port listesini al
      const loadInitialPorts = async () => {
        try {
          const ports = await ipcRenderer.invoke('get-ports');
          setAvailablePorts(ports);
        } catch (error) {
          console.error('Port listesi alma hatası:', error);
        }
      };

      // Event listeners'ı kaydet
      ipcRenderer.on('ports-updated', handlePortsUpdate);
      ipcRenderer.on('connection-status', handleConnectionStatus);
      ipcRenderer.on('telemetry-update', handleTelemetryUpdate);

      loadInitialPorts();

      // Cleanup
      return () => {
        ipcRenderer.removeListener('ports-updated', handlePortsUpdate);
        ipcRenderer.removeListener('connection-status', handleConnectionStatus);
        ipcRenderer.removeListener('telemetry-update', handleTelemetryUpdate);
      };
    }
  }, []);

  // Resize detection ONLY after loading is complete
  useEffect(() => {
    if (isLoading) return;
    
    let resizeTimer: NodeJS.Timeout;
    
    const handleResize = () => {
      document.body.classList.add('resizing');
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        document.body.classList.remove('resizing');
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimer);
    };
  }, [isLoading]);

  // Get available cameras
  const getCameras = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setCameras(videoDevices);
      if (videoDevices.length > 0 && !selectedCamera) {
        setSelectedCamera(videoDevices[0].deviceId);
      }
    } catch (error) {
      setCameraError('Kamera erişimi için izin gerekli');
    }
  };

  // Start camera stream
  const startCamera = async (deviceId: string) => {
    try {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          deviceId: deviceId ? { exact: deviceId } : undefined,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          aspectRatio: { ideal: 16/9 }
        },
        audio: false
      });

      setCameraStream(stream);
      setCameraError('');
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      setCameraError('Kamera başlatılamadı: ' + (error as Error).message);
    }
  };

  // Stop camera stream
  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Handle camera selection change
  const handleCameraChange = (deviceId: string) => {
    setSelectedCamera(deviceId);
    if (deviceId) {
      startCamera(deviceId);
    }
  };

  // Initialize cameras on mount
  useEffect(() => {
    getCameras();
    return () => {
      stopCamera();
    };
  }, []);

  // Start camera when selected
  useEffect(() => {
    if (selectedCamera && activeTab === 'autonomous') {
      startCamera(selectedCamera);
    } else {
      stopCamera();
    }
  }, [selectedCamera, activeTab]);

  if (isLoading) {
    return <LoadingScreen onLoadComplete={handleLoadComplete} />;
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'main':
        return (
          <DroneController 
            onConnectionChange={setDroneConnected}
            availablePorts={availablePorts}
            setAvailablePorts={setAvailablePorts}
            connected={droneConnected}
            selectedPort={selectedPort}
            selectedBaudrate={selectedBaudrate}
            setSelectedPort={setSelectedPort}
            connecting={connecting}
            setConnecting={setConnecting}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            telemetry={telemetry}
          />
        );
      case 'livedata':
        return (
          <LiveData 
            telemetry={telemetry}
            connected={droneConnected}
          />
        );
      case 'autonomous':
        return (
          <div className="tab-content">
            <div className="autonomous-container">
              <div className="main-content autonomous-layout">
                {/* Sol: Autonomous Telemetry Panel (20%) */}
                <div className="telemetry-panel">
                  <h3>AUTONOMOUS TELEMETRY</h3>
                  <div className="telemetry-grid">
                    <div className="telemetry-item">
                      <span className="label">Mission Status:</span>
                      <span className="value">{droneConnected ? 'ACTIVE' : 'STANDBY'}</span>
                    </div>
                    <div className="telemetry-item">
                      <span className="label">Flight Mode:</span>
                      <span className="value">{telemetry.mode}</span>
                    </div>
                    <div className="telemetry-item">
                      <span className="label">Armed:</span>
                      <span className="value">{telemetry.armed ? 'YES' : 'NO'}</span>
                    </div>
                    <div className="telemetry-item">
                      <span className="label">Battery:</span>
                      <span className="value">{telemetry.battery}%</span>
                    </div>
                    <div className="telemetry-item">
                      <span className="label">Voltage:</span>
                      <span className="value">{telemetry.voltage.toFixed(2)}V</span>
                    </div>
                    <div className="telemetry-item">
                      <span className="label">GPS Lat:</span>
                      <span className="value">{telemetry.gpsLat.toFixed(6)}</span>
                    </div>
                    <div className="telemetry-item">
                      <span className="label">GPS Lon:</span>
                      <span className="value">{telemetry.gpsLon.toFixed(6)}</span>
                    </div>
                    <div className="telemetry-item">
                      <span className="label">Altitude:</span>
                      <span className="value">{telemetry.altitude.toFixed(1)} m</span>
                    </div>
                    <div className="telemetry-item">
                      <span className="label">Ground Speed:</span>
                      <span className="value">{telemetry.groundSpeed.toFixed(1)} m/s</span>
                    </div>
                    <div className="telemetry-item">
                      <span className="label">Satellites:</span>
                      <span className="value">{telemetry.satellites}</span>
                    </div>
                    <div className="telemetry-item">
                      <span className="label">RSSI:</span>
                      <span className="value">{telemetry.rssi}</span>
                    </div>
                    <div className="telemetry-item">
                      <span className="label">Heartbeat:</span>
                      <span className="value">{telemetry.lastHeartbeat > 0 ? 'OK' : 'NONE'}</span>
                    </div>
                  </div>
                  
                  {/* Connection Status */}
                  <div className="connection-status">
                    <h4>CONNECTION STATUS</h4>
                    <div className="status-indicator">
                      <span className={`status-light ${droneConnected ? 'connected' : 'disconnected'}`}></span>
                      <span className="status-text">{connectionMessage || 'Disconnected'}</span>
                    </div>
                  </div>
                </div>

                {/* Orta: Camera Panel (40%) */}
                <div className="camera-panel">
                  <h3>CAMERA FEED</h3>
                  
                  {/* Camera Selection */}
                  <div className="camera-controls">
                    <label htmlFor="camera-select">Kamera Seç:</label>
                    <select 
                      id="camera-select"
                      value={selectedCamera} 
                      onChange={(e) => handleCameraChange(e.target.value)}
                      className="camera-select"
                    >
                      <option value="">Kamera Seçin</option>
                      {cameras.map((camera, index) => (
                        <option key={camera.deviceId} value={camera.deviceId}>
                          {camera.label || `Kamera ${index + 1}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Camera Display */}
                  <div className="camera-display">
                    {cameraError ? (
                      <div className="camera-error">
                        <p>{cameraError}</p>
                        <button onClick={getCameras} className="retry-btn">
                          Tekrar Dene
                        </button>
                      </div>
                    ) : (
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="camera-video"
                      />
                    )}
                  </div>

                  {/* Camera Info */}
                  <div className="camera-info">
                    <div className="info-item">
                      <span className="info-label">Durum:</span>
                      <span className="info-value">
                        {cameraStream ? 'AKTIF' : 'KAPALI'}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Kameralar:</span>
                      <span className="info-value">{cameras.length}</span>
                    </div>
                  </div>
                </div>

                {/* Sağ: GPS Position Map (40%) */}
                <div className="map-panel">
                  <h3>GPS POSITION MAP</h3>
                  <div className="map-container">
                    {/* Map Layer Toggle Buttons */}
                    <div className="map-layer-controls">
                      <button 
                        className={`layer-btn ${mapLayer === 'streets' ? 'active' : ''}`}
                        onClick={() => setMapLayer('streets')}
                      >
                        STREETS
                      </button>
                      <button 
                        className={`layer-btn ${mapLayer === 'satellite' ? 'active' : ''}`}
                        onClick={() => setMapLayer('satellite')}
                      >
                        SATELLITE
                      </button>
                      <button 
                        className={`layer-btn ${mapLayer === 'terrain' ? 'active' : ''}`}
                        onClick={() => setMapLayer('terrain')}
                      >
                        TERRAIN
                      </button>
                    </div>

                    <MapContainer
                      center={[telemetry.gpsLat || 39.9334, telemetry.gpsLon || 32.8597]}
                      zoom={15}
                      style={{ height: '100%', width: '100%' }}
                      className="drone-map autonomous-map"
                      attributionControl={false}
                    >
                      <TileLayer
                        key={mapLayer}
                        attribution={getTileUrl().attribution}
                        url={getTileUrl().url}
                        maxZoom={19}
                      />
                      {droneConnected && telemetry.gpsLat !== 0 && telemetry.gpsLon !== 0 && (
                        <Marker 
                          position={[telemetry.gpsLat, telemetry.gpsLon]} 
                          icon={droneIcon}
                        >
                          <Popup>
                            <div className="drone-popup">
                              <strong>Drone Position</strong><br/>
                              Lat: {telemetry.gpsLat.toFixed(6)}<br/>
                              Lng: {telemetry.gpsLon.toFixed(6)}<br/>
                              Alt: {telemetry.altitude.toFixed(1)}m<br/>
                              Speed: {telemetry.groundSpeed.toFixed(1)} m/s<br/>
                              Heading: {telemetry.heading.toFixed(0)}°<br/>
                              Mode: {telemetry.mode}<br/>
                              Armed: {telemetry.armed ? 'YES' : 'NO'}
                            </div>
                          </Popup>
                        </Marker>
                      )}
                    </MapContainer>

                    {/* Coordinates Overlay */}
                    <div className="coordinates-overlay">
                      <div>LAT: {telemetry.gpsLat.toFixed(6)}</div>
                      <div>LNG: {telemetry.gpsLon.toFixed(6)}</div>
                      <div>ALT: {telemetry.altitude.toFixed(1)}m</div>
                      <div>MODE: {telemetry.mode}</div>
                      <div>GPS: {telemetry.satellites} sats</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'motor':
        return (
          <div className="tab-content">
            <div className="motor-test-container">
              <h2>MOTOR TEST - COMING SOON</h2>
              <p>Motor test functionality will be implemented in future versions.</p>
            </div>
          </div>
        );
      case 'options':
        return <Options />;
      default:
        return null;
    }
  };

  return (
    <div className={`App ${appVisible ? 'visible' : ''}`}>
      <Header 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        availablePorts={availablePorts}
        selectedPort={selectedPort}
        selectedBaudrate={selectedBaudrate}
        setSelectedPort={setSelectedPort}
        onBaudrateChange={handleBaudrateChange}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
        connecting={connecting}
        connected={droneConnected}
      />
      {renderTabContent()}
      
      {/* Connection Dialog */}
      <ConnectionDialog
        isVisible={connectionState === 'connecting' || (connectionState === 'connected' && connectionProgress !== '') || connectionState === 'failed'}
        progress={connectionProgress}
        onCancel={handleCancelConnection}
        connectionState={connectionState}
      />
    </div>
  );
}

export default App;
