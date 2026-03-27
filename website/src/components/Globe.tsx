"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function Globe() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 3;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const AMBER = 0xd4a012;
    const globe = new THREE.Group();

    // ── Wireframe sphere ──────────────────────────────────────
    const wire = new THREE.WireframeGeometry(new THREE.SphereGeometry(1, 28, 28));
    globe.add(new THREE.LineSegments(wire, new THREE.LineBasicMaterial({
      color: AMBER, opacity: 0.07, transparent: true,
    })));

    // ── Latitude lines ────────────────────────────────────────
    for (let lat = -60; lat <= 60; lat += 30) {
      const r = Math.cos((lat * Math.PI) / 180);
      const y = Math.sin((lat * Math.PI) / 180);
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 80; i++) {
        const a = (i / 80) * Math.PI * 2;
        pts.push(new THREE.Vector3(r * Math.cos(a), y, r * Math.sin(a)));
      }
      globe.add(new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({ color: AMBER, opacity: 0.3, transparent: true })
      ));
    }

    // ── Longitude lines ───────────────────────────────────────
    for (let lon = 0; lon < 360; lon += 30) {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 80; i++) {
        const a = (i / 80) * Math.PI * 2;
        const v = new THREE.Vector3(Math.cos(a), Math.sin(a), 0);
        v.applyAxisAngle(new THREE.Vector3(0, 1, 0), (lon * Math.PI) / 180);
        pts.push(v);
      }
      globe.add(new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({ color: AMBER, opacity: 0.18, transparent: true })
      ));
    }

    // ── Surface dots (varied sizes) ───────────────────────────
    const dotPos: number[] = [];
    const dotSizes: number[] = [];
    for (let i = 0; i < 700; i++) {
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = Math.random() * Math.PI * 2;
      const r = 1.003 + Math.random() * 0.004;
      dotPos.push(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      );
      dotSizes.push(0.8 + Math.random() * 2.5);
    }
    const dotGeo = new THREE.BufferGeometry();
    dotGeo.setAttribute("position", new THREE.Float32BufferAttribute(dotPos, 3));
    dotGeo.setAttribute("size", new THREE.Float32BufferAttribute(dotSizes, 1));
    globe.add(new THREE.Points(dotGeo, new THREE.PointsMaterial({
      color: AMBER, size: 0.015, opacity: 0.6, transparent: true, sizeAttenuation: true,
    })));

    scene.add(globe);

    // ── Orbit rings (two, tilted differently) ─────────────────
    function makeOrbitRing(radius: number, tiltX: number, tiltZ: number, opacity: number) {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 128; i++) {
        const a = (i / 128) * Math.PI * 2;
        pts.push(new THREE.Vector3(radius * Math.cos(a), 0, radius * Math.sin(a)));
      }
      const ring = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({ color: AMBER, opacity, transparent: true })
      );
      ring.rotation.x = tiltX;
      ring.rotation.z = tiltZ;
      return ring;
    }

    const ring1 = makeOrbitRing(1.2, Math.PI / 2.3, 0.25, 0.25);
    const ring2 = makeOrbitRing(1.35, Math.PI / 3, -0.4, 0.12);
    scene.add(ring1, ring2);

    // ── Scanning dot on ring1 ─────────────────────────────────
    const scanDot = new THREE.Mesh(
      new THREE.SphereGeometry(0.02, 8, 8),
      new THREE.MeshBasicMaterial({ color: AMBER, opacity: 0.9, transparent: true })
    );
    ring1.add(scanDot);

    // ── Glow core (inner sphere) ──────────────────────────────
    const glowMat = new THREE.MeshBasicMaterial({
      color: AMBER, opacity: 0.03, transparent: true, side: THREE.BackSide,
    });
    scene.add(new THREE.Mesh(new THREE.SphereGeometry(0.98, 32, 32), glowMat));

    // ── Outer atmosphere haze ─────────────────────────────────
    const hazeMat = new THREE.MeshBasicMaterial({
      color: AMBER, opacity: 0.04, transparent: true, side: THREE.BackSide,
    });
    scene.add(new THREE.Mesh(new THREE.SphereGeometry(1.15, 32, 32), hazeMat));

    // ── Floating particles around globe ───────────────────────
    const particlePos: number[] = [];
    const particleVelocities: number[] = [];
    for (let i = 0; i < 80; i++) {
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = Math.random() * Math.PI * 2;
      const r = 1.2 + Math.random() * 0.6;
      particlePos.push(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      );
      particleVelocities.push(
        (Math.random() - 0.5) * 0.001,
        (Math.random() - 0.5) * 0.001,
        (Math.random() - 0.5) * 0.001,
      );
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute("position", new THREE.Float32BufferAttribute(particlePos, 3));
    const particles = new THREE.Points(particleGeo, new THREE.PointsMaterial({
      color: AMBER, size: 0.008, opacity: 0.4, transparent: true, sizeAttenuation: true,
    }));
    scene.add(particles);

    // ── Animate ───────────────────────────────────────────────
    let time = 0;
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      time += 0.016;

      globe.rotation.y += 0.0025;
      ring1.rotation.z += 0.003;
      ring2.rotation.z -= 0.001;

      // Scan dot orbits
      const angle = time * 1.2;
      scanDot.position.set(1.2 * Math.cos(angle), 0, 1.2 * Math.sin(angle));

      // Pulse the glow
      glowMat.opacity = 0.025 + 0.015 * Math.sin(time * 2);
      hazeMat.opacity = 0.03 + 0.02 * Math.sin(time * 1.5);

      // Drift floating particles
      const pos = particleGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < 80; i++) {
        const ix = i * 3;
        pos.array[ix] += particleVelocities[ix];
        pos.array[ix + 1] += particleVelocities[ix + 1];
        pos.array[ix + 2] += particleVelocities[ix + 2];

        // Keep particles in range
        const dist = Math.sqrt(
          pos.array[ix] ** 2 + pos.array[ix + 1] ** 2 + pos.array[ix + 2] ** 2
        );
        if (dist > 2 || dist < 1.15) {
          particleVelocities[ix] *= -1;
          particleVelocities[ix + 1] *= -1;
          particleVelocities[ix + 2] *= -1;
        }
      }
      pos.needsUpdate = true;

      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      container.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} className="w-full h-full" />;
}
