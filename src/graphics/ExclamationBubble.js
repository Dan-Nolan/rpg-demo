import Phaser from "phaser";

export class ExclamationBubble extends Phaser.GameObjects.Graphics {
  constructor(scene, x, y) {
    super(scene);

    this.scene = scene;
    this.x = x;
    this.y = y;

    const bubbleWidth = 40;
    const bubbleHeight = 50;
    const bubblePadding = 10;

    // Define the bubble's appearance
    this.lineStyle(2, 0xffffff, 1); // White border
    this.fillStyle(0xffffff, 1); // White fill

    // Draw the speech bubble shape with a pointer
    this.beginPath();
    // Top left arc
    this.arc(
      bubblePadding,
      bubblePadding,
      bubblePadding,
      Phaser.Math.DegToRad(180),
      Phaser.Math.DegToRad(270),
      false
    );
    // Top edge
    this.lineTo(bubbleWidth - bubblePadding, 0);
    // Top right arc
    this.arc(
      bubbleWidth - bubblePadding,
      bubblePadding,
      bubblePadding,
      Phaser.Math.DegToRad(270),
      Phaser.Math.DegToRad(360),
      false
    );
    // Right edge
    this.lineTo(bubbleWidth, bubbleHeight - bubblePadding);
    // Bottom right arc
    this.arc(
      bubbleWidth - bubblePadding,
      bubbleHeight - bubblePadding,
      bubblePadding,
      Phaser.Math.DegToRad(0),
      Phaser.Math.DegToRad(90),
      false
    );
    // Bottom edge with pointer
    this.lineTo(bubbleWidth / 2 + 10, bubbleHeight);
    this.lineTo(bubbleWidth / 2, bubbleHeight + 10); // Pointer
    this.lineTo(bubbleWidth / 2 - 10, bubbleHeight);
    // Bottom left arc
    this.arc(
      bubblePadding,
      bubbleHeight - bubblePadding,
      bubblePadding,
      Phaser.Math.DegToRad(90),
      Phaser.Math.DegToRad(180),
      false
    );
    // Left edge
    this.lineTo(0, bubblePadding);
    this.closePath();
    this.fillPath();
    this.strokePath();

    // Draw the exclamation mark inside the bubble
    this.fillStyle(0x000000, 1); // Black color for the exclamation mark
    // Exclamation point rectangle
    this.fillRect(bubbleWidth / 2 - 2, bubbleHeight / 2 - 15, 4, 20);
    // Exclamation point dot
    this.fillRect(bubbleWidth / 2 - 2, bubbleHeight / 2 + 10, 4, 4);

    // Hide the bubble initially
    this.setVisible(false);

    // Add this graphics object to the scene
    this.scene.add.existing(this);
  }
}
