import { useRef, useEffect, useState } from 'react';
import { useAppState } from '../store';
import * as THREE from 'three';


export default function View3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const { state } = useAppState();
  const { currentPlan } = state;
  
  const [isRotating, setIsRotating] = useState(true);
  const [cameraAngle, setCameraAngle] = useState(0);
  const [cameraHeight, setCameraHeight] = useState(12);
  const [cameraDistance, setCameraDistance] = useState(20);
  const [isDragging, setIsDragging] = useState(false);
  const [lastMouseX, setLastMouseX] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);

    const width = container.clientWidth;
    const height = container.clientHeight;
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(12, 14, 18);
    camera.lookAt(8, 0, 5);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);

    const room = currentPlan.room;

    // Floor
    const floorGeom = new THREE.PlaneGeometry(room.width, room.height);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.8 });
    const floor = new THREE.Mesh(floorGeom, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(room.width / 2, 0, room.height / 2);
    floor.receiveShadow = true;
    scene.add(floor);

    // Walls
    const wallHeight = 3;
    const wallThickness = 0.15;
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.5 });

    // Front wall
    const frontWall = new THREE.Mesh(
      new THREE.BoxGeometry(room.width, wallHeight, wallThickness),
      wallMat
    );
    frontWall.position.set(room.width / 2, wallHeight / 2, 0);
    frontWall.castShadow = true;
    scene.add(frontWall);

    // Back wall
    const backWall = new THREE.Mesh(
      new THREE.BoxGeometry(room.width, wallHeight, wallThickness),
      wallMat
    );
    backWall.position.set(room.width / 2, wallHeight / 2, room.height);
    backWall.castShadow = true;
    scene.add(backWall);

    // Left wall
    const leftWall = new THREE.Mesh(
      new THREE.BoxGeometry(wallThickness, wallHeight, room.height),
      wallMat
    );
    leftWall.position.set(0, wallHeight / 2, room.height / 2);
    leftWall.castShadow = true;
    scene.add(leftWall);

    // Right wall
    const rightWall = new THREE.Mesh(
      new THREE.BoxGeometry(wallThickness, wallHeight, room.height),
      wallMat
    );
    rightWall.position.set(room.width, wallHeight / 2, room.height / 2);
    rightWall.castShadow = true;
    scene.add(rightWall);

    // Zones as colored floor areas
    currentPlan.zones.forEach((zone) => {
      // Создаём геометрию напрямую в плоскости XZ (пол)
      const vertices: number[] = [];
      const indices: number[] = [];
      
      // Добавляем вершины (x, 0, y) - преобразуем 2D координаты в 3D
      zone.points.forEach((p) => {
        vertices.push(p.x, 0, p.y);
      });
      
      // Создаём треугольники для полигона (простая триангуляция)
      for (let i = 1; i < zone.points.length - 1; i++) {
        indices.push(0, i, i + 1);
      }
      
      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      geom.setIndex(indices);
      geom.computeVertexNormals();
      
      const color = new THREE.Color(zone.color);
      const mat = new THREE.MeshStandardMaterial({
        color,
        transparent: true,
        opacity: 0.2,
        roughness: 0.9,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.y = 0.01;
      scene.add(mesh);

      // Zone border
      const borderVertices: number[] = [];
      zone.points.forEach((p, i) => {
        borderVertices.push(p.x, 0.02, p.y);
        const next = zone.points[(i + 1) % zone.points.length];
        borderVertices.push(next.x, 0.02, next.y);
      });
      
      const borderGeom = new THREE.BufferGeometry();
      borderGeom.setAttribute('position', new THREE.Float32BufferAttribute(borderVertices, 3));
      
      const lineMat = new THREE.LineBasicMaterial({ color, opacity: 0.6, transparent: true });
      const line = new THREE.LineSegments(borderGeom, lineMat);
      scene.add(line);
    });

    // Objects as 3D boxes
    currentPlan.objects.forEach((obj) => {
      const objHeight = obj.type === 'shelf' ? 1.8 : obj.type === 'camera' ? 0.15 : 0.9;
      const geom = new THREE.BoxGeometry(obj.width, objHeight, obj.height);
      const color = new THREE.Color(obj.color);
      const mat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.4,
        metalness: 0.1,
      });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(
        obj.x + obj.width / 2,
        objHeight / 2,
        obj.y + obj.height / 2
      );
      mesh.rotation.y = (obj.rotation * Math.PI) / 180;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);

      // Object edges
      const edges = new THREE.EdgesGeometry(geom);
      const edgeMat = new THREE.LineBasicMaterial({ color: 0x000000, opacity: 0.2, transparent: true });
      const edgeLine = new THREE.LineSegments(edges, edgeMat);
      edgeLine.position.copy(mesh.position);
      edgeLine.rotation.copy(mesh.rotation);
      scene.add(edgeLine);
    });

    // Grid helper
    const gridHelper = new THREE.GridHelper(Math.max(room.width, room.height) + 4, 20, 0x444444, 0x333333);
    gridHelper.position.set(room.width / 2, -0.01, room.height / 2);
    scene.add(gridHelper);

    // Camera control variables
    let angle = 0;
    let autoRotate = true;
    let animFrame: number;
    let isDragging = false;
    let lastMouseX = 0;
    let cameraDistance = 20;
    let cameraHeight = 12;

    // Mouse handlers for camera control
    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      autoRotate = false;
      lastMouseX = e.clientX;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const deltaX = e.clientX - lastMouseX;
        angle -= deltaX * 0.005;
        lastMouseX = e.clientX;
      }
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      cameraDistance += e.deltaY * 0.02;
      cameraDistance = Math.max(10, Math.min(50, cameraDistance));
    };

    // Attach mouse events to renderer
    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    renderer.domElement.addEventListener('mouseup', handleMouseUp);
    renderer.domElement.addEventListener('mouseleave', handleMouseUp);
    renderer.domElement.addEventListener('wheel', handleWheel, { passive: false });

    // Animation loop
    const animate = () => {
      if (autoRotate) {
        angle += 0.002;
      }
      
      camera.position.x = room.width / 2 + Math.cos(angle) * cameraDistance;
      camera.position.z = room.height / 2 + Math.sin(angle) * cameraDistance;
      camera.position.y = cameraHeight;
      camera.lookAt(room.width / 2, 0, room.height / 2);
      renderer.render(scene, camera);
      animFrame = requestAnimationFrame(animate);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      renderer.domElement.removeEventListener('mouseup', handleMouseUp);
      renderer.domElement.removeEventListener('mouseleave', handleMouseUp);
      renderer.domElement.removeEventListener('wheel', handleWheel);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [currentPlan]);

  return (
    <div className="flex-1 flex flex-col bg-[#141414]">
      <div className="px-6 py-3 border-b border-slate-800 bg-[#1e1e1e] flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">3D-представление</h2>
          <p className="text-xs text-slate-400">Упрощённая визуализация плана в перспективе</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500" /> Рабочие места
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500" /> Кассовые окна
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> Стеллажи
          </span>
        </div>
      </div>
      <div ref={containerRef} className="flex-1 relative">
        <div className="absolute bottom-4 left-4 bg-[#1e1e1e]/90 backdrop-blur rounded-lg px-3 py-2 text-xs text-slate-300 border border-slate-700">
          🖱️ Перетаскивание — вращение | Колесо — масштаб
        </div>
      </div>
    </div>
  );
}
