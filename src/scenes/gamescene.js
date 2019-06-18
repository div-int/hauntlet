import Phaser from 'phaser';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    preload() {
        console.log('GameScene::preload()');
    }

    create() {
        this.cameras.main.setBackgroundColor('#ff0000');
    }

    update() {
    }
}