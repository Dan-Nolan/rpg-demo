import Phaser from "phaser";
import { BattleScene } from "./scenes/BattleScene";
import { MainScene } from "./scenes/MainScene";

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: {
    default: "arcade",
    arcade: {
      debug: false,
    },
  },
  scene: [MainScene, BattleScene],
};

new Phaser.Game(config);
