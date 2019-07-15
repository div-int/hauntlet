import "phaser";
import config from "./config/config";
import GameScene, { UIScene } from "./scenes/gamescene";
class HauntletGame extends Phaser.Game {
  version: string;

  constructor(config: Phaser.Types.Core.GameConfig, startlevel: string) {
    super(config);

    this.scene.add("GameScene", new GameScene(startlevel));
    this.scene.add("UIScene", new UIScene());
    this.scene.start("GameScene");
    this.scene.start("UIScene");
  }

  getVersion() {
    return this.version;
  }
}

window.onload = function() {
  //window.game = new HauntletGame();

  var hauntletGame = new HauntletGame(config, "level_4");
};
