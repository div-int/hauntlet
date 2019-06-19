import Phaser from 'phaser';
import config from './config/config';
import GameScene from './scenes/gamescene';

class HauntletGame extends Phaser.Game {
  constructor() {
    super(config);

    console.log('HauntletGame::constructor()');

    this.scene.add('GameScene', GameScene);
    this.scene.start('GameScene');
  }
}

window.onload = function () {
  window.game = new HauntletGame();
}
