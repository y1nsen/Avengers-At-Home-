// SLAM Gyroscope Tracking Persistence Manager
// Holds 3D model position in real-world space when direct card line-of-sight is temporarily lost
import * as THREE from 'three';

export class TrackingPersistenceManager {
  constructor(options = {}) {
    this.persistenceTimeoutMs = options.persistenceTimeoutMs || 2500;
    this.onPersistenceExpired = options.onPersistenceExpired || (() => {});
    this.onTrackingRestored = options.onTrackingRestored || (() => {});

    this.isTracking = false;
    this.isPersisting = false;
    this.persistenceStartTime = 0;

    // Anchor & Model references
    this.anchorGroup = null;
    this.model = null;

    // Last known anchor transforms relative to camera
    this.lastPosition = new THREE.Vector3();
    this.lastQuaternion = new THREE.Quaternion();
    this.lastScale = new THREE.Vector3(1, 1, 1);

    // Device orientation references
    this.hasGyro = false;
    this.deviceQuaternion = new THREE.Quaternion();
    this.refDeviceQuaternion = new THREE.Quaternion();
    this.screenOrientationAngle = 90; // Default landscape

    // Math caches
    this._degToRad = Math.PI / 180;
    this._zee = new THREE.Vector3(0, 0, 1);
    this._euler = new THREE.Euler();
    this._q0 = new THREE.Quaternion();
    this._q1 = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5)); // -PI/2 on X
    this._deltaQ = new THREE.Quaternion();
    this._invDeltaQ = new THREE.Quaternion();
    this._targetPos = new THREE.Vector3();
    this._targetQuat = new THREE.Quaternion();

    this.initDeviceOrientation();
  }

  initDeviceOrientation() {
    if (typeof window === 'undefined') return;

    const handleOrientation = (event) => {
      if (event.alpha === null || event.beta === null || event.gamma === null) return;
      this.hasGyro = true;

      // Determine landscape angle
      let angle = 90;
      if (window.screen && window.screen.orientation && window.screen.orientation.angle !== undefined) {
        angle = window.screen.orientation.angle;
      } else if (window.orientation !== undefined) {
        angle = window.orientation;
      }
      this.screenOrientationAngle = angle;

      // Compute current device quaternion
      this.computeDeviceQuaternion(event.alpha, event.beta, event.gamma, angle, this.deviceQuaternion);
    };

    window.addEventListener('deviceorientation', handleOrientation, true);
  }

  computeDeviceQuaternion(alpha, beta, gamma, orientAngle, outQuat) {
    this._euler.set(beta * this._degToRad, alpha * this._degToRad, -gamma * this._degToRad, 'YXZ');
    outQuat.setFromEuler(this._euler);
    outQuat.multiply(this._q1); // Camera faces -Z
    outQuat.multiply(this._q0.setFromAxisAngle(this._zee, -orientAngle * this._degToRad));
  }

  attach(model, anchorGroup) {
    this.model = model;
    this.anchorGroup = anchorGroup;
  }

  onTargetFound(anchorGroup) {
    if (anchorGroup) this.anchorGroup = anchorGroup;

    const wasPersisting = this.isPersisting;
    this.isTracking = true;
    this.isPersisting = false;

    if (wasPersisting) {
      console.log('[Persistence] Card re-acquired! Smoothly restoring anchor tracking.');
      this.onTrackingRestored();
    }

    if (this.hasGyro) {
      this.refDeviceQuaternion.copy(this.deviceQuaternion);
    }
  }

  onTargetLost() {
    if (!this.isTracking) return;

    this.isTracking = false;
    this.isPersisting = true;
    this.persistenceStartTime = performance.now();

    // Snapshot reference transforms
    if (this.anchorGroup) {
      this.lastPosition.copy(this.anchorGroup.position);
      this.lastQuaternion.copy(this.anchorGroup.quaternion);
      this.lastScale.copy(this.anchorGroup.scale);
    }

    if (this.hasGyro) {
      this.refDeviceQuaternion.copy(this.deviceQuaternion);
    }

    console.log(`[Persistence] Line-of-sight lost. Entering SLAM Gyroscope Fallback (${this.persistenceTimeoutMs}ms grace period).`);
  }

  update(delta) {
    if (!this.model) return;

    if (this.isTracking && this.anchorGroup) {
      // Actively tracked: sample current anchor transform and orientation
      this.lastPosition.copy(this.anchorGroup.position);
      this.lastQuaternion.copy(this.anchorGroup.quaternion);
      this.lastScale.copy(this.anchorGroup.scale);

      if (this.hasGyro) {
        // Slowly align reference orientation to prevent gyro drift during active tracking
        this.refDeviceQuaternion.slerp(this.deviceQuaternion, 0.05);
      }
      return;
    }

    if (this.isPersisting && this.anchorGroup) {
      const elapsed = performance.now() - this.persistenceStartTime;

      if (elapsed > this.persistenceTimeoutMs) {
        console.log('[Persistence] Persistence grace period expired. Hiding model.');
        this.isPersisting = false;
        if (this.model) this.model.visible = false;
        this.onPersistenceExpired();
        return;
      }

      // SLAM Gyroscope Fallback: calculate delta orientation of phone
      if (this.hasGyro) {
        // Delta = ref^-1 * current
        this._deltaQ.copy(this.refDeviceQuaternion).invert().multiply(this.deviceQuaternion);
        this._invDeltaQ.copy(this._deltaQ).invert();

        // Counter-rotate position and quaternion in camera space
        this._targetPos.copy(this.lastPosition).applyQuaternion(this._invDeltaQ);
        this._targetQuat.copy(this._invDeltaQ).multiply(this.lastQuaternion);

        // Smoothly interpolate anchor group to counter-pose
        this.anchorGroup.position.lerp(this._targetPos, 0.4);
        this.anchorGroup.quaternion.slerp(this._targetQuat, 0.4);
      } else {
        // Fallback without gyroscope: freeze in place
        this.anchorGroup.position.copy(this.lastPosition);
        this.anchorGroup.quaternion.copy(this.lastQuaternion);
      }

      // Keep model visible during persistence
      this.model.visible = true;
    }
  }

  reset() {
    this.isTracking = false;
    this.isPersisting = false;
  }
}
