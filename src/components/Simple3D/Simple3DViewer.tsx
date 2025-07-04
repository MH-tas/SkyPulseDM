import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import './Simple3DViewer.css';

interface Simple3DViewerProps {
  width?: number;
  height?: number;
  autoRotate?: boolean;
  modelPath?: string; // .obj dosya yolu
  pitch?: number;    // Pitch rotation in degrees
  roll?: number;     // Roll rotation in degrees  
  yaw?: number;      // Yaw rotation in degrees
}

const Simple3DViewer: React.FC<Simple3DViewerProps> = ({ 
  width = 280, 
  height = 200, 
  autoRotate = false,
  modelPath, // .obj dosya yolu
  pitch = 0,
  roll = 0, 
  yaw = 0
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const droneGroupRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000811);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 0, 5); // Tam düz seviye açı
    camera.lookAt(0, 0, 0);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    // Shadow maps disabled for better performance
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 5);
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0x2196F3, 0.5);
    pointLight.position.set(-10, -10, -5);
    scene.add(pointLight);

    // Create drone model
    const droneGroup = new THREE.Group();
    droneGroupRef.current = droneGroup;

    // Try to load OBJ file if path provided
    if (modelPath) {
      const loader = new OBJLoader();
      loader.load(
        modelPath,
        // Success callback
        (obj) => {
          // Scale and position the loaded model
          obj.scale.set(1, 1, 1); // Much bigger now!
          obj.position.set(0, 0, 0);
          
          // Apply material to all meshes
          obj.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.material = new THREE.MeshPhongMaterial({ 
                color: 0xFFFFFF, // Beyaz renk
                shininess: 50
              });
            }
          });
          
          droneGroup.add(obj);
          console.log('OBJ model loaded successfully!');
        },
        // Progress callback
        (progress) => {
          console.log('Loading progress:', progress);
        },
        // Error callback
        (error) => {
          console.error('Error loading OBJ:', error);
          // Fall back to default drone model
          createDefaultDrone(droneGroup);
        }
      );
    } else {
      // Create default drone model
      createDefaultDrone(droneGroup);
    }

    scene.add(droneGroup);

    // Default drone creation function
    function createDefaultDrone(group: THREE.Group) {
      // Main drone body
      const bodyGeometry = new THREE.BoxGeometry(1.2, 0.3, 0.3);
      const bodyMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x2196F3, 
        shininess: 100 
      });
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      group.add(body);

      // Drone arms
      const armGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.6);
      const armMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });

      const arm1 = new THREE.Mesh(armGeometry, armMaterial);
      arm1.position.set(0.8, 0, 0.8);
      group.add(arm1);

      const arm2 = new THREE.Mesh(armGeometry, armMaterial);
      arm2.position.set(-0.8, 0, 0.8);
      group.add(arm2);

      const arm3 = new THREE.Mesh(armGeometry, armMaterial);
      arm3.position.set(0.8, 0, -0.8);
      group.add(arm3);

      const arm4 = new THREE.Mesh(armGeometry, armMaterial);
      arm4.position.set(-0.8, 0, -0.8);
      group.add(arm4);

      // Propellers
      const propGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.02);
      const propMaterial = new THREE.MeshPhongMaterial({ color: 0xffaa00 });

      const prop1 = new THREE.Mesh(propGeometry, propMaterial);
      prop1.position.set(0.8, 0.3, 0.8);
      group.add(prop1);

      const prop2 = new THREE.Mesh(propGeometry, propMaterial);
      prop2.position.set(-0.8, 0.3, 0.8);
      group.add(prop2);

      const prop3 = new THREE.Mesh(propGeometry, propMaterial);
      prop3.position.set(0.8, 0.3, -0.8);
      group.add(prop3);

      const prop4 = new THREE.Mesh(propGeometry, propMaterial);
      prop4.position.set(-0.8, 0.3, -0.8);
      group.add(prop4);
    }

    // Camera controls disabled - fixed camera position

    // Mount to DOM
    mountRef.current.appendChild(renderer.domElement);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      // Apply telemetry-based rotations or auto-rotate
      if (droneGroupRef.current) {
        if (autoRotate) {
          // Simple auto-rotation for demo mode
          droneGroupRef.current.rotation.y += 0.01;
        } else {
          // Use telemetry data for realistic drone orientation
          // Convert degrees to radians and apply rotations
          droneGroupRef.current.rotation.x = pitch * (Math.PI / 180); // Pitch (nose up/down)
          droneGroupRef.current.rotation.z = -roll * (Math.PI / 180); // Roll (bank left/right) - negative for correct direction
          droneGroupRef.current.rotation.y = yaw * (Math.PI / 180);   // Yaw (turn left/right)
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      scene.clear();
    };
  }, [width, height, autoRotate, modelPath, pitch, roll, yaw]);

  return (
    <div className="simple-3d-viewer">
      <div ref={mountRef} />
      <div className="viewer-info">
        <span>3D DRONE MODEL</span>
        <small>Vanilla Three.js</small>
      </div>
    </div>
  );
};

export default Simple3DViewer; 