import React, { Suspense, useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, useGLTF, Center, Environment } from '@react-three/drei';
import * as THREE from 'three';
import './Model3DViewer.css';

interface Model3DViewerProps {
  modelPath: string;
  width?: number;
  height?: number;
  autoRotate?: boolean;
  showControls?: boolean;
  pitch?: number;
  roll?: number;
  yaw?: number;
}

// Model component for loading 3D models
const Model: React.FC<{ path: string; autoRotate: boolean; pitch?: number; roll?: number; yaw?: number }> = ({ path, autoRotate, pitch = 0, roll = 0, yaw = 0 }) => {
  const meshRef = useRef<THREE.Group>(null);
  
  // Try to load the model (supports GLB/GLTF format)
  let model;
  try {
    model = useGLTF(path);
  } catch (error) {
    console.error('Error loading 3D model:', error);
    return (
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#6699cc" />
      </mesh>
    );
  }

  // Auto rotation animation
  useFrame((state, delta) => {
    if (autoRotate && meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <Center>
      <primitive 
        ref={meshRef}
        object={model.scene} 
        scale={1}
      />
    </Center>
  );
};

// OBJ Placeholder component (for now showing a 3D placeholder)
const OBJModel: React.FC<{ path: string; autoRotate: boolean }> = ({ path, autoRotate }) => {
  const meshRef = useRef<THREE.Group>(null);

  // Auto rotation animation
  useFrame((state, delta) => {
    if (autoRotate && meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  // Drone-like placeholder model
  return (
    <Center>
      <group ref={meshRef}>
        {/* Main drone body */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1.2, 0.3, 0.3]} />
          <meshStandardMaterial 
            color="#2196F3" 
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>
        
        {/* Drone arms */}
        <mesh position={[0.8, 0, 0.8]}>
          <cylinderGeometry args={[0.05, 0.05, 0.6]} />
          <meshStandardMaterial color="#333" />
        </mesh>
        <mesh position={[-0.8, 0, 0.8]}>
          <cylinderGeometry args={[0.05, 0.05, 0.6]} />
          <meshStandardMaterial color="#333" />
        </mesh>
        <mesh position={[0.8, 0, -0.8]}>
          <cylinderGeometry args={[0.05, 0.05, 0.6]} />
          <meshStandardMaterial color="#333" />
        </mesh>
        <mesh position={[-0.8, 0, -0.8]}>
          <cylinderGeometry args={[0.05, 0.05, 0.6]} />
          <meshStandardMaterial color="#333" />
        </mesh>
        
        {/* Propellers */}
        <mesh position={[0.8, 0.3, 0.8]} rotation={[0, 0, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 0.02]} />
          <meshStandardMaterial color="#ffaa00" />
        </mesh>
        <mesh position={[-0.8, 0.3, 0.8]} rotation={[0, 0, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 0.02]} />
          <meshStandardMaterial color="#ffaa00" />
        </mesh>
        <mesh position={[0.8, 0.3, -0.8]} rotation={[0, 0, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 0.02]} />
          <meshStandardMaterial color="#ffaa00" />
        </mesh>
        <mesh position={[-0.8, 0.3, -0.8]} rotation={[0, 0, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 0.02]} />
          <meshStandardMaterial color="#ffaa00" />
        </mesh>
      </group>
    </Center>
  );
};

const Model3DViewer: React.FC<Model3DViewerProps> = ({ 
  modelPath, 
  width = 300, 
  height = 300, 
  autoRotate = true,
  showControls = true 
}) => {
  const isOBJ = modelPath.toLowerCase().endsWith('.obj');
  
  return (
    <div className="model-3d-viewer" style={{ width, height }}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        style={{ background: 'linear-gradient(135deg, #000811 0%, #0a1428 100%)' }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} />
        
        {/* Environment for reflections */}
        <Environment preset="night" />
        
        {/* Model */}
        <Suspense fallback={
          <mesh>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#ffaa00" />
          </mesh>
        }>
          {isOBJ ? (
            <OBJModel path={modelPath} autoRotate={autoRotate} />
          ) : (
            <Model path={modelPath} autoRotate={autoRotate} />
          )}
        </Suspense>
        
        {/* Controls */}
        {showControls && (
          <OrbitControls 
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            autoRotate={autoRotate}
            autoRotateSpeed={2}
          />
        )}
      </Canvas>
      
      {/* Info overlay */}
      <div className="model-info">
        <span>3D MODEL</span>
        <small>{modelPath.split('/').pop()}</small>
      </div>
    </div>
  );
};

export default Model3DViewer; 