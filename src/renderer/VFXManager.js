// High-End Particle & Energy VFX Manager
import * as THREE from 'three';

export class VFXManager {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
    this.auras = [];
  }

  // Energy Burst on Attack
  triggerAttackBurst(position = new THREE.Vector3(0, 0.8, 0.8), colorHex = 0x0059ff) {
    const count = 40;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = [];

    for (let i = 0; i < count; i++) {
      positions[i * 3] = position.x;
      positions[i * 3 + 1] = position.y;
      positions[i * 3 + 2] = position.z;

      velocities.push(
        (Math.random() - 0.5) * 2.5,
        (Math.random() - 0.2) * 2.5,
        (Math.random() - 0.5) * 2.5
      );
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: colorHex,
      size: 0.06,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending
    });

    const points = new THREE.Points(geometry, material);
    this.scene.add(points);

    this.particles.push({
      points,
      velocities,
      life: 0.6,
      maxLife: 0.6
    });
  }

  // Golden Shield Ring on Kinetic Bastion
  triggerShieldAura(position = new THREE.Vector3(0, 0.1, 0)) {
    const geometry = new THREE.RingGeometry(0.7, 0.85, 32);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffd900,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });

    const ring = new THREE.Mesh(geometry, material);
    ring.rotation.x = -Math.PI / 2;
    ring.position.copy(position);
    this.scene.add(ring);

    this.auras.push({
      mesh: ring,
      life: 1.5,
      maxLife: 1.5
    });
  }

  update(delta) {
    // Update particle bursts
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= delta;
      const progress = p.life / p.maxLife;

      const positions = p.points.geometry.attributes.position.array;
      for (let j = 0; j < p.velocities.length / 3; j++) {
        positions[j * 3] += p.velocities[j * 3] * delta;
        positions[j * 3 + 1] += p.velocities[j * 3 + 1] * delta;
        positions[j * 3 + 2] += p.velocities[j * 3 + 2] * delta;
      }
      p.points.geometry.attributes.position.needsUpdate = true;
      p.points.material.opacity = progress;

      if (p.life <= 0) {
        this.scene.remove(p.points);
        p.points.geometry.dispose();
        p.points.material.dispose();
        this.particles.splice(i, 1);
      }
    }

    // Update glowing auras
    for (let i = this.auras.length - 1; i >= 0; i--) {
      const a = this.auras[i];
      a.life -= delta;
      a.mesh.scale.multiplyScalar(1 + delta * 0.4);
      a.mesh.material.opacity = a.life / a.maxLife;

      if (a.life <= 0) {
        this.scene.remove(a.mesh);
        a.mesh.geometry.dispose();
        a.mesh.material.dispose();
        this.auras.splice(i, 1);
      }
    }
  }
}
