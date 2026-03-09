"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Text3D, Float, Sparkles, Environment } from "@react-three/drei";
import * as THREE from "three";

interface FloatingBalance3DProps {
  balance: number;
  className?: string;
}

function FloatingNumber({ value }: { value: number }) {
  const textRef = useRef<THREE.Mesh>(null);
  const [prevValue, setPrevValue] = useState(value);
  const [exploding, setExploding] = useState(false);

  useEffect(() => {
    if (value !== prevValue) {
      setExploding(true);
      setTimeout(() => setExploding(false), 800);
      setPrevValue(value);
    }
  }, [value, prevValue]);

  useFrame((state) => {
    if (textRef.current) {
      textRef.current.rotation.y += 0.002;
      textRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  const formattedValue = value.toLocaleString("ru-RU");

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <Text3D
        ref={textRef}
        font="/fonts/helvetiker_regular.typeface.json"
        size={1.2}
        height={0.3}
        curveSegments={12}
        bevelEnabled
        bevelThickness={0.05}
        bevelSize={0.02}
        bevelOffset={0}
        bevelSegments={5}
      >
        {formattedValue}
        <meshPhysicalMaterial
          color="#FBBF24"
          emissive="#F59E0B"
          emissiveIntensity={0.8}
          metalness={0.9}
          roughness={0.2}
          clearcoat={1}
          clearcoatRoughness={0.1}
        />
      </Text3D>

      {exploding && (
        <Sparkles
          count={30}
          scale={[4, 4, 4]}
          size={0.6}
          speed={1.5}
          color="#FBBF24"
        />
      )}
    </Float>
  );
}

function Platform() {
  const coinsRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (coinsRef.current) {
      coinsRef.current.rotation.y += 0.001;
    }
  });

  return (
    <group position={[0, -1.5, 0]}>
      <mesh receiveShadow position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[3, 3, 0.2, 64]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.6} roughness={0.3} emissive="#0a0a0f" />
      </mesh>

      <mesh position={[0, 0.1, 0]}>
        <torusGeometry args={[2.8, 0.05, 16, 100]} />
        <meshStandardMaterial color="#ec4899" emissive="#ec4899" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0, 0.2, 0]}>
        <torusGeometry args={[2.6, 0.03, 16, 100]} />
        <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={0.5} />
      </mesh>

      <group ref={coinsRef}>
        {[...Array(8)].map((_, i) => (
          <mesh
            key={i}
            position={[
              Math.sin((i / 8) * Math.PI * 2) * 2,
              0.3,
              Math.cos((i / 8) * Math.PI * 2) * 2,
            ]}
            rotation={[Math.PI / 2, 0, (i / 8) * Math.PI * 2]}
          >
            <cylinderGeometry args={[0.3, 0.3, 0.05, 24]} />
            <meshStandardMaterial
              color="#FBBF24"
              emissive="#F59E0B"
              metalness={0.8}
              roughness={0.2}
            />
          </mesh>
        ))}
        {[...Array(4)].map((_, i) => (
          <mesh
            key={i + 8}
            position={[
              Math.sin((i / 4) * Math.PI * 2 + 0.5) * 1.5,
              0.4,
              Math.cos((i / 4) * Math.PI * 2 + 0.5) * 1.5,
            ]}
            rotation={[0, (i / 4) * Math.PI * 2, Math.PI / 2]}
          >
            <torusKnotGeometry args={[0.2, 0.05, 64, 8]} />
            <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" metalness={0.5} roughness={0.3} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

export default function FloatingBalance3D({ balance, className = "" }: FloatingBalance3DProps) {
  const [key, setKey] = useState(0);

  useEffect(() => {
    setKey((prev) => prev + 1);
  }, [balance]);

  return (
    <div className={`w-full h-96 ${className}`}>
      <Canvas
        key={key}
        shadows
        camera={{ position: [0, 2, 8], fov: 45 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: "#0a0a0f" }}
      >
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={0.8} />
        <pointLight position={[-10, 5, 5]} intensity={0.5} color="#FBBF24" />
        <pointLight position={[5, 5, -10]} intensity={0.5} color="#ec4899" />

        <Environment preset="city" />

        <Platform />

        <FloatingNumber value={balance} />

        <Sparkles count={50} scale={[6, 4, 6]} size={0.4} speed={0.4} color="#FBBF24" />
      </Canvas>
    </div>
  );
}
