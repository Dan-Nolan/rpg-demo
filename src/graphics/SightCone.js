import Phaser from "phaser";

export class SightCone extends Phaser.GameObjects.Graphics {
  constructor(scene, enemy) {
    super(scene);

    this.scene = scene;
    this.enemy = enemy;

    // Define the appearance of the sight cone
    this.fillStyle(0xffff00, 0.3); // Yellow with 30% opacity
    const coneLength = 200;
    const coneWidth = 60; // Reduced width to prevent overlapping

    // Draw the cone shape pointing upwards; rotation will align it with the enemy's orientation
    this.beginPath();
    this.moveTo(0, 0);
    this.lineTo(-coneWidth / 2, -coneLength);
    this.lineTo(coneWidth / 2, -coneLength);
    this.closePath();
    this.fillPath();

    // Position and rotate the sight cone to match the enemy's orientation
    this.setPosition(enemy.x, enemy.y);
    this.rotation = enemy.rotation;

    // Add this graphics object to the scene
    this.scene.add.existing(this);
  }

  updatePosition() {
    this.setPosition(this.enemy.x, this.enemy.y);
    this.rotation = this.enemy.rotation;
  }
}
