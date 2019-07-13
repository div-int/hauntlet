import "phaser";
import config from "./config/config";
import GameScene from "./scenes/gamescene";
class HauntletGame extends Phaser.Game {
  version: string;

  constructor(config: Phaser.Types.Core.GameConfig, startlevel: string) {
    super(config);

    this.scene.add("GameScene", new GameScene(startlevel));
    this.scene.start("GameScene");
  }

  getVersion() {
    return this.version;
  }
}

window.onload = function() {
  //window.game = new HauntletGame();

  var hauntletGame = new HauntletGame(config, "level_3");
};
