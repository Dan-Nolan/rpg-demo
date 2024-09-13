import Phaser from "phaser";

export class BattleScene extends Phaser.Scene {
  constructor() {
    super("BattleScene");
    this.canSelect = true; // Initialize the selection flag
  }

  create(data) {
    // Dynamic Battle Status Text
    this.battleStatusText = this.add
      .text(400, 50, "Battle Start!", { fontSize: "32px" })
      .setOrigin(0.5);

    // Initialize Menu State
    this.menuState = "main"; // 'main' or 'attack'

    // Player and Enemy Health
    this.playerHealth = 100;
    this.enemyHealth = 100;
    this.playerHealthDisplay = this.playerHealth;
    this.enemyHealthDisplay = this.enemyHealth;

    // Player (Red Circle)
    this.player = this.add.circle(200, 300, 50, 0xff0000);

    // Enemy (Green Triangle)
    this.enemy = this.add.triangle(600, 300, 0, 40, 40, 40, 20, 0, 0x00ff00);
    this.enemy.rotation = data.enemyRotation || 0;

    // Health Bars and Texts
    this.playerHealthBarBg = this.add.graphics();
    this.playerHealthBar = this.add.graphics();
    this.playerHealthText = this.add.text(0, 0, "", {
      fontSize: "14px",
      color: "#ffffff",
    });
    this.enemyHealthBarBg = this.add.graphics();
    this.enemyHealthBar = this.add.graphics();
    this.enemyHealthText = this.add.text(0, 0, "", {
      fontSize: "14px",
      color: "#ffffff",
    });
    this.updateHealthBars();

    // Main Menu Items
    this.mainMenuItems = [];
    this.attackMenuItems = [];

    // Create menu background container
    this.menuContainer = this.add.container();

    // Create menu background rectangle
    this.menuBg = this.add.graphics();
    this.menuBg.lineStyle(2, 0xffffff, 1);
    this.menuBg.fillStyle(0x000000, 1);
    // We will adjust the size after adding the menu items

    // Add the menu background to the container
    this.menuContainer.add(this.menuBg);

    // Create main menu items
    const menuStartY = 400; // Adjusted to provide vertical margin from the bottom
    const menuItemSpacing = 40;
    let currentY = menuStartY;

    this.mainMenuTitle = this.add
      .text(30, currentY, "Choose an action:", { fontSize: "24px" })
      .setOrigin(0, 0);
    this.mainMenuItems.push(this.mainMenuTitle);
    currentY += menuItemSpacing;

    this.attackButton = this.add
      .text(50, currentY, "Attack", { fontSize: "24px" })
      .setOrigin(0, 0);
    this.mainMenuItems.push(this.attackButton);
    currentY += menuItemSpacing;

    this.defendButton = this.add
      .text(50, currentY, "Defend", { fontSize: "24px" })
      .setOrigin(0, 0);
    this.mainMenuItems.push(this.defendButton);
    currentY += menuItemSpacing;

    // Add main menu items to the container
    this.mainMenuItems.forEach((item) => {
      this.menuContainer.add(item);
    });

    // Now that we know the size of the menu, we can draw the menu background
    let menuWidth = 300; // Increased width to fit prompts
    let menuHeight = currentY - menuStartY + 20;
    this.menuBg.fillRect(20, menuStartY - 10, menuWidth, menuHeight);
    this.menuBg.strokeRect(20, menuStartY - 10, menuWidth, menuHeight);

    // Selection Indicator
    this.selectionIndicator = this.add.triangle(
      40,
      0,
      0,
      10,
      10,
      5,
      0,
      0,
      0xffffff
    );
    this.menuContainer.add(this.selectionIndicator);
    this.selectionIndex = 0;
    this.mainMenuLength = 2; // Number of items in main menu
    this.attackMenuLength = 2; // Number of items in attack menu
    this.updateSelectionIndicator();

    // Input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.enterKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.ENTER
    );

    // Ensure input is enabled when the scene starts
    this.input.keyboard.enabled = true;
  }

  update() {
    if (!this.canSelect) return;
    if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
      if (this.menuState === "main") {
        this.selectionIndex =
          (this.selectionIndex - 1 + this.mainMenuLength) % this.mainMenuLength;
      } else if (this.menuState === "attack") {
        this.selectionIndex =
          (this.selectionIndex - 1 + this.attackMenuLength) %
          this.attackMenuLength;
      }
      this.updateSelectionIndicator();
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
      if (this.menuState === "main") {
        this.selectionIndex = (this.selectionIndex + 1) % this.mainMenuLength;
      } else if (this.menuState === "attack") {
        this.selectionIndex = (this.selectionIndex + 1) % this.attackMenuLength;
      }
      this.updateSelectionIndicator();
    } else if (
      Phaser.Input.Keyboard.JustDown(this.cursors.space) ||
      Phaser.Input.Keyboard.JustDown(this.enterKey)
    ) {
      if (this.menuState === "main") {
        if (this.selectionIndex === 0) {
          // Go to attack submenu
          this.menuState = "attack";
          this.showAttackMenu();
        } else if (this.selectionIndex === 1) {
          this.defend();
        }
      } else if (this.menuState === "attack") {
        if (this.selectionIndex === 0) {
          // Punch move selected
          this.attack();
        } else if (this.selectionIndex === 1) {
          // Back to main menu
          this.menuState = "main";
          this.showMainMenu();
        }
      }
    }
  }

  updateSelectionIndicator() {
    let indicatorX = 40;
    let indicatorY = 0;
    if (this.menuState === "main") {
      if (this.selectionIndex === 0) {
        indicatorY = this.attackButton.y + 5;
      } else if (this.selectionIndex === 1) {
        indicatorY = this.defendButton.y + 5;
      }
    } else if (this.menuState === "attack") {
      if (this.selectionIndex === 0) {
        indicatorY = this.punchButton.y + 5;
      } else if (this.selectionIndex === 1) {
        indicatorY = this.backButton.y + 5;
      }
    }
    this.selectionIndicator.setPosition(indicatorX, indicatorY);
  }

  showAttackMenu() {
    // Hide main menu items
    this.mainMenuItems.forEach((item) => item.setVisible(false));

    // Remove main menu items from container
    this.menuContainer.remove(this.mainMenuTitle);
    this.menuContainer.remove(this.attackButton);
    this.menuContainer.remove(this.defendButton);

    // Create attack menu items if not already created
    if (!this.attackMenuItems.length) {
      let currentY = this.mainMenuTitle.y;

      this.attackMenuTitle = this.add
        .text(30, currentY, "Choose a move:", { fontSize: "24px" })
        .setOrigin(0, 0);
      this.attackMenuItems.push(this.attackMenuTitle);
      currentY += 40;

      this.punchButton = this.add
        .text(50, currentY, "Punch", { fontSize: "24px" })
        .setOrigin(0, 0);
      this.attackMenuItems.push(this.punchButton);
      currentY += 40;

      this.backButton = this.add
        .text(50, currentY, "Back", { fontSize: "24px" })
        .setOrigin(0, 0);
      this.attackMenuItems.push(this.backButton);
      currentY += 40;

      // Update attackMenuLength
      this.attackMenuLength = 2; // Punch and Back

      // Add attack menu items to the container
      this.attackMenuItems.forEach((item) => {
        this.menuContainer.add(item);
      });

      // Update menu background size
      let menuHeight = currentY - this.attackMenuTitle.y + 20;
      this.menuBg.clear();
      this.menuBg.lineStyle(2, 0xffffff, 1);
      this.menuBg.fillStyle(0x000000, 1);
      this.menuBg.fillRect(20, this.attackMenuTitle.y - 10, 300, menuHeight);
      this.menuBg.strokeRect(20, this.attackMenuTitle.y - 10, 300, menuHeight);
    } else {
      // If already created, just make them visible
      this.attackMenuItems.forEach((item) => item.setVisible(true));

      // Add attack menu items to the container
      this.attackMenuItems.forEach((item) => {
        this.menuContainer.add(item);
      });
    }

    // Reset selectionIndex for attack menu
    this.selectionIndex = 0;
    this.updateSelectionIndicator();
  }

  showMainMenu() {
    // Hide attack menu items
    this.attackMenuItems.forEach((item) => item.setVisible(false));

    // Remove attack menu items from container
    this.attackMenuItems.forEach((item) => {
      this.menuContainer.remove(item);
    });

    // Show main menu items
    this.mainMenuItems.forEach((item) => item.setVisible(true));

    // Add main menu items back to container
    this.mainMenuItems.forEach((item) => {
      this.menuContainer.add(item);
    });

    // Update menu background size
    let menuHeight = this.defendButton.y - this.mainMenuTitle.y + 50;
    this.menuBg.clear();
    this.menuBg.lineStyle(2, 0xffffff, 1);
    this.menuBg.fillStyle(0x000000, 1);
    this.menuBg.fillRect(20, this.mainMenuTitle.y - 10, 300, menuHeight);
    this.menuBg.strokeRect(20, this.mainMenuTitle.y - 10, 300, menuHeight);

    // Reset selectionIndex
    this.selectionIndex = 0;
    this.updateSelectionIndicator();
  }

  updateHealthBars() {
    // Health bar dimensions
    let barWidth = 100;
    let barHeight = 10;

    // Player Health Bar Background
    this.playerHealthBarBg.clear();
    this.playerHealthBarBg.fillStyle(0x333333, 1);
    this.playerHealthBarBg.fillRect(
      this.player.x - barWidth / 2,
      this.player.y - 70,
      barWidth,
      barHeight
    );

    // Player Health Bar
    this.playerHealthBar.clear();
    this.playerHealthBar.fillStyle(0x00ff00, 1);
    let playerHealthPercentage = this.playerHealthDisplay / 100;
    this.playerHealthBar.fillRect(
      this.player.x - barWidth / 2,
      this.player.y - 70,
      barWidth * playerHealthPercentage,
      barHeight
    );

    // Player Health Text
    this.playerHealthText.setText(
      Math.round(this.playerHealthDisplay) + " / 100"
    );
    this.playerHealthText.setPosition(
      this.player.x - this.playerHealthText.width / 2,
      this.player.y - 90
    );

    // Enemy Health Bar Background
    this.enemyHealthBarBg.clear();
    this.enemyHealthBarBg.fillStyle(0x333333, 1);
    this.enemyHealthBarBg.fillRect(
      this.enemy.x - barWidth / 2,
      this.enemy.y - 70,
      barWidth,
      barHeight
    );

    // Enemy Health Bar
    this.enemyHealthBar.clear();
    this.enemyHealthBar.fillStyle(0x00ff00, 1);
    let enemyHealthPercentage = this.enemyHealthDisplay / 100;
    this.enemyHealthBar.fillRect(
      this.enemy.x - barWidth / 2,
      this.enemy.y - 70,
      barWidth * enemyHealthPercentage,
      barHeight
    );

    // Enemy Health Text
    this.enemyHealthText.setText(
      Math.round(this.enemyHealthDisplay) + " / 100"
    );
    this.enemyHealthText.setPosition(
      this.enemy.x - this.enemyHealthText.width / 2,
      this.enemy.y - 90
    );
  }

  attack() {
    // Disable selection during attack
    this.canSelect = false;

    // Generate random damage between 15 and 25
    const damage = Phaser.Math.Between(15, 25);

    // Update battle status text
    this.battleStatusText.setText(`Circle punches for ${damage}!`);

    // Player attack animation
    this.tweens.add({
      targets: this.player,
      x: this.player.x + 20,
      yoyo: true,
      duration: 100,
      repeat: 3,
      onComplete: () => {
        // Enemy gets hit
        let previousHealth = this.enemyHealth;
        this.enemyHealth -= damage;

        // Ensure health doesn't go below zero
        if (this.enemyHealth < 0) this.enemyHealth = 0;

        // Enemy hit animation
        this.tweens.add({
          targets: this.enemy,
          alpha: 0,
          duration: 100,
          yoyo: true,
          repeat: 3,
          onComplete: () => {
            // Animate health decrease
            this.tweens.addCounter({
              from: previousHealth,
              to: this.enemyHealth,
              duration: 500,
              onUpdate: (tween) => {
                this.enemyHealthDisplay = tween.getValue();
                this.updateHealthBars();
              },
              onComplete: () => {
                // Check if enemy is defeated
                if (this.enemyHealth <= 0) {
                  this.battleStatusText.setText(`Enemy defeated!`);
                  // Delay before transitioning to next scene
                  this.time.delayedCall(1000, () => {
                    this.scene.start("MainScene");
                  });
                } else {
                  // Enemy's turn to attack
                  this.enemyAttack();
                }
              },
            });
          },
        });
      },
    });
  }

  defend() {
    // Disable selection during defend
    this.canSelect = false;

    // Player defends (reduces incoming damage)
    // Update battle status text
    this.battleStatusText.setText(`Circle is defending!`);

    // Indicate defending status (could add a shield icon or effect)
    this.isDefending = true;

    // Enemy's turn to attack
    this.enemyAttack();
  }

  enemyAttack() {
    // Generate random damage between 8 and 12
    let damage = Phaser.Math.Between(8, 12);

    // If player is defending, reduce damage
    if (this.isDefending) {
      damage = Math.floor(damage / 2);
      this.isDefending = false; // Reset defending status
    }

    // Update battle status text
    this.battleStatusText.setText(`Triangle punches for ${damage}!`);

    // Enemy attack animation
    this.tweens.add({
      targets: this.enemy,
      x: this.enemy.x - 20,
      yoyo: true,
      duration: 100,
      repeat: 3,
      onComplete: () => {
        // Player gets hit
        let previousHealth = this.playerHealth;
        this.playerHealth -= damage;

        // Ensure health doesn't go below zero
        if (this.playerHealth < 0) this.playerHealth = 0;

        // Player hit animation
        this.tweens.add({
          targets: this.player,
          alpha: 0,
          duration: 100,
          yoyo: true,
          repeat: 3,
          onComplete: () => {
            // Animate health decrease
            this.tweens.addCounter({
              from: previousHealth,
              to: this.playerHealth,
              duration: 500,
              onUpdate: (tween) => {
                this.playerHealthDisplay = tween.getValue();
                this.updateHealthBars();
              },
              onComplete: () => {
                // Check if player is defeated
                if (this.playerHealth <= 0) {
                  this.battleStatusText.setText(`You were defeated!`);
                  // Delay before transitioning to game over scene
                  this.time.delayedCall(1000, () => {
                    this.scene.start("GameOverScene");
                  });
                } else {
                  // Return to main menu
                  this.canSelect = true; // Re-enable selection after enemy attack
                  this.battleStatusText.setText(`Choose an action:`);
                  this.menuState = "main";
                  this.showMainMenu();
                }
              },
            });
          },
        });
      },
    });
  }
}
