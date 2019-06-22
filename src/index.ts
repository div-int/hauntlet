import 'phaser';
import config from './config/config';
import GameScene from './scenes/gamescene';

class HauntletGame extends Phaser.Game {
  constructor(config: Phaser.Types.Core.GameConfig) {
    super(config);

    console.log('HauntletGame::constructor()');

    this.scene.add('GameScene', GameScene);
    this.scene.start('GameScene');
  }
}

window.onload = function () {
  //window.game = new HauntletGame();

  var game = new HauntletGame(config);
}
