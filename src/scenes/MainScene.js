import Phaser from "phaser";
import { ExclamationBubble } from "../graphics/ExclamationBubble";
import { SightCone } from "../graphics/SightCone";

// Define constants for enemy orientations
const TRIANGLE_FACING_LEFT = -Math.PI / 2;
const TRIANGLE_FACING_RIGHT = Math.PI / 2;
const TRIANGLE_FACING_DOWN = Math.PI;
const FACING_UP = 0;

export class MainScene extends Phaser.Scene {
  constructor() {
    super("MainScene");
  }

  preload() {
    // No external assets needed; dialog bubble is drawn programmatically
  }

  create() {
    // ---------------------------
    // Player Setup
    // ---------------------------
    this.player = this.add.circle(400, 300, 20, 0xff0000);
    this.physics.add.existing(this.player);
    this.input.keyboard.enabled = true;

    // Configure the player's physics body
    this.player.body.setCircle(20);
    this.player.body.setCollideWorldBounds(true); // Prevent player from moving out of bounds

    // Player movement controls
    this.cursors = this.input.keyboard.createCursorKeys();

    // ---------------------------
    // Enemies Setup
    // ---------------------------
    this.enemies = this.add.group();

    // Spawn enemies at specified positions and orientations
    this.spawnEnemy(200, 150, TRIANGLE_FACING_RIGHT);
    this.spawnEnemy(600, 450, TRIANGLE_FACING_LEFT);
    this.spawnEnemy(700, 100, TRIANGLE_FACING_DOWN);

    // Define patrol boundaries (optional for more complex patrol behavior)
    this.patrolBounds = {
      xMin: 100,
      xMax: 700,
      yMin: 100,
      yMax: 500,
    };
  }

  /**
   * Spawns an enemy at the given position and rotation.
   * @param {number} x - The x-coordinate of the enemy.
   * @param {number} y - The y-coordinate of the enemy.
   * @param {number} rotation - The rotation angle of the enemy in radians.
   */
  spawnEnemy(x, y, rotation) {
    // Create the enemy visually as a green triangle
    const enemy = this.add.triangle(x, y, 0, 20, 20, 20, 10, 0, 0x00ff00);
    this.physics.add.existing(enemy);

    // Configure the enemy's physics body
    enemy.body.setSize(20, 20); // Approximate size; adjust as needed
    enemy.rotation = rotation;
    enemy.setData("state", "patrol"); // Initialize state

    // Define patrol movement parameters
    enemy.setData("patrolSpeed", 50 + Math.random() * 50); // Random speed between 50 and 100
    enemy.setData("patrolDirection", Phaser.Math.Between(0, 1) ? 1 : -1); // 1 for forward, -1 for backward

    // Create and attach an exclamation bubble (initially hidden)
    enemy.exclamation = new ExclamationBubble(this, enemy.x, enemy.y - 100);
    enemy.exclamation.setDepth(1); // Ensure it's rendered above the enemy

    // Create and attach a sight cone to the enemy
    enemy.sightCone = new SightCone(this, enemy);

    // Add the enemy to the enemies group
    this.enemies.add(enemy);
  }

  /**
   * Handles the detection of the player by an enemy.
   * @param {Phaser.GameObjects.GameObject} enemy - The enemy that detected the player.
   */
  onPlayerDetected(enemy) {
    if (enemy.getData("state") === "patrol") {
      // Change state to 'alert'
      enemy.setData("state", "alert");

      // Stop enemy's movement
      if (enemy.patrolTween) {
        enemy.patrolTween.stop();
        enemy.patrolTween = null;
      }

      // Freeze the player character
      this.player.body.setVelocity(0);
      this.input.keyboard.enabled = false;

      this.alertEnemy(enemy);
    }
  }

  /**
   * Alerts the enemy that the player has been detected.
   * @param {Phaser.GameObjects.Triangle} enemy - The enemy to alert.
   */
  alertEnemy(enemy) {
    // Display the exclamation bubble with animations
    enemy.exclamation.setVisible(true);
    enemy.exclamation.setScale(0);
    enemy.exclamation.setAlpha(0);
    enemy.exclamation.setAngle(0);

    // Turn off the enemy's sight cone
    enemy.sightCone.setVisible(false);

    // Animate the bubble scaling up and rotating in
    this.tweens.add({
      targets: enemy.exclamation,
      scale: 1,
      alpha: 1,
      angle: 360,
      duration: 200,
      ease: "Back.easeOut",
    });

    // Animate the enemy jumping
    this.tweens.add({
      targets: enemy,
      y: enemy.y - 10,
      duration: 75,
      yoyo: true,
      onComplete: () => {
        // Wait 500 milliseconds before chasing the player
        this.time.delayedCall(500, () => {
          // Change enemy state to 'chase'
          enemy.setData("state", "chase");
        });
      },
    });

    // Animate the bubble scaling down and fading out after it appears
    this.time.delayedCall(400, () => {
      this.tweens.add({
        targets: enemy.exclamation,
        alpha: 0,
        duration: 300,
        ease: "Back.easeIn",
        onComplete: () => {
          enemy.exclamation.setVisible(false);
        },
      });
    });
  }

  /**
   * Starts the battle scene with the specified enemy.
   * @param {Phaser.GameObjects.Triangle} enemy - The enemy to battle.
   */
  startBattle(enemy) {
    // Stop enemy's movement
    enemy.body.setVelocity(0);
    if (enemy.patrolTween) {
      enemy.patrolTween.stop();
      enemy.patrolTween = null;
    }

    // Reset enemy state to 'patrol' after battle initiation
    enemy.setData("state", "patrol");

    // Transition to the BattleScene, passing enemy rotation if needed
    this.scene.start("BattleScene", { enemyRotation: TRIANGLE_FACING_LEFT });
  }

  update() {
    const speed = 150;

    // ---------------------------
    // Player Movement Handling
    // ---------------------------
    this.player.body.setVelocity(0); // Reset velocity

    if (this.input.keyboard.enabled) {
      if (this.cursors.left.isDown) {
        this.player.body.setVelocityX(-speed);
      }
      if (this.cursors.right.isDown) {
        this.player.body.setVelocityX(speed);
      }
      if (this.cursors.up.isDown) {
        this.player.body.setVelocityY(-speed);
      }
      if (this.cursors.down.isDown) {
        this.player.body.setVelocityY(speed);
      }
    }

    // ---------------------------
    // Enemies Behavior Handling
    // ---------------------------
    this.enemies.getChildren().forEach((enemy) => {
      const state = enemy.getData("state");

      if (state === "patrol") {
        // Patrol Behavior: Move left and right within a set distance
        if (!enemy.patrolTween) {
          const patrolDistance = 100;
          enemy.patrolTween = this.tweens.add({
            targets: enemy,
            x: enemy.x + patrolDistance * enemy.getData("patrolDirection"),
            duration: 2000 + Math.random() * 2000, // Random duration between 2-4 seconds
            yoyo: true,
            repeat: -1,
            onYoyo: () => {
              // Reverse patrol direction at each end
              enemy.setData(
                "patrolDirection",
                -enemy.getData("patrolDirection")
              );
            },
            onUpdate: () => {
              // Continuously update sight cone position and rotation
              this.updateSightCone(enemy);
              // Ensure exclamation bubble stays above the enemy
              enemy.exclamation.setPosition(enemy.x - 25, enemy.y - 90);
            },
          });
        }
      } else if (state === "chase") {
        // Chase Behavior: Move towards the player
        this.physics.moveToObject(enemy, this.player, 250); // Faster speed for chasing

        // Update enemy rotation to face the player
        const angle = Phaser.Math.Angle.Between(
          enemy.x,
          enemy.y,
          this.player.x,
          this.player.y
        );
        enemy.rotation = angle + Math.PI / 2; // Adjust rotation to align with sight cone

        // Update sight cone position and rotation
        this.updateSightCone(enemy);

        // Check if the enemy is close enough to initiate battle
        if (
          Phaser.Math.Distance.Between(
            enemy.x,
            enemy.y,
            this.player.x,
            this.player.y
          ) < 35
        ) {
          this.startBattle(enemy);
        }
      } else if (state === "alert") {
        // Alert State: Enemy is in the process of initiating battle
        // No additional behavior needed here
      }
    });

    // ---------------------------
    // Manual Collision Detection
    // ---------------------------
    this.enemies.getChildren().forEach((enemy) => {
      const state = enemy.getData("state");
      if (state === "patrol") {
        // Construct the sight cone polygon for collision detection
        const sightPolygon = this.getSightConePolygon(enemy);
        // Start of Selection
        // Create a circle representing the player's body
        const playerCircle = new Phaser.Geom.Circle(
          this.player.x,
          this.player.y,
          this.player.body.radius
        );

        // Check if the player's center is within the sight polygon
        if (
          Phaser.Geom.Polygon.ContainsPoint(
            sightPolygon,
            new Phaser.Geom.Point(this.player.x, this.player.y)
          )
        ) {
          this.onPlayerDetected(enemy);
        } else {
          // Iterate through the edges of the polygon to check for intersection
          const points = sightPolygon.points;
          for (let i = 0; i < points.length; i++) {
            const start = points[i];
            const end = points[(i + 1) % points.length];
            const line = new Phaser.Geom.Line(start.x, start.y, end.x, end.y);
            if (Phaser.Geom.Intersects.LineToCircle(line, playerCircle)) {
              this.onPlayerDetected(enemy);
              break;
            }
          }
        }
      }
    });
  }
  /**
   * Constructs a polygon representing the enemy's sight cone.
   * @param {Phaser.GameObjects.Triangle} enemy - The enemy whose sight cone to construct.
   * @returns {Phaser.Geom.Polygon} The polygon representing the sight cone.
   */
  getSightConePolygon(enemy) {
    const coneLength = 200;
    const coneWidth = 60;

    // Define the three points in local coordinates (relative to enemy position)
    const p0 = new Phaser.Geom.Point(0, 0); // Tip of the cone
    const p1 = new Phaser.Geom.Point(-coneWidth / 2, -coneLength); // Left base point
    const p2 = new Phaser.Geom.Point(coneWidth / 2, -coneLength); // Right base point

    // Apply rotation to each point to get world coordinates
    const cos = Math.cos(enemy.rotation);
    const sin = Math.sin(enemy.rotation);

    const worldP0 = new Phaser.Geom.Point(
      enemy.x + (p0.x * cos - p0.y * sin),
      enemy.y + (p0.x * sin + p0.y * cos)
    );

    const worldP1 = new Phaser.Geom.Point(
      enemy.x + (p1.x * cos - p1.y * sin),
      enemy.y + (p1.x * sin + p1.y * cos)
    );

    const worldP2 = new Phaser.Geom.Point(
      enemy.x + (p2.x * cos - p2.y * sin),
      enemy.y + (p2.x * sin + p2.y * cos)
    );

    // Create polygon using the transformed points
    return new Phaser.Geom.Polygon([
      worldP0.x,
      worldP0.y,
      worldP1.x,
      worldP1.y,
      worldP2.x,
      worldP2.y,
    ]);
  }

  /**
   * Updates the position and rotation of the enemy's sight cone to match the enemy.
   * @param {Phaser.GameObjects.Triangle} enemy - The enemy whose sight cone to update.
   */
  updateSightCone(enemy) {
    if (enemy.sightCone.visible) {
      enemy.sightCone.updatePosition();
    }
  }
}
