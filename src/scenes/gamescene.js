import Phaser from 'phaser';
import testJSON from '../assets/maps/tiled/test.json';
import testTilesPNG from '../assets/images/tiles/test.extruded.png';
import logoPNG from '../assets/images/logo.png';

var map;
var mapTiles;
var mapLayers = [];
var position = 0;
var cameraScale = 1;
var logo, logoImage;

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    preload() {
        console.log('GameScene::preload()');

        this.load.tilemapTiledJSON('testMap', testJSON);
        this.load.image('testTiles', testTilesPNG);
        logoImage = this.load.image('logo', logoPNG);
    }

    create() {
        map = this.add.tilemap('testMap');
        mapTiles = map.addTilesetImage('test', 'testTiles');
        mapLayers[0] = map.createStaticLayer('Floor', mapTiles).setScale(4,4);
        mapLayers[1] = map.createStaticLayer('Shadows', mapTiles).setScale(4, 4);
        mapLayers[2] = map.createStaticLayer('Walls', mapTiles).setScale(4, 4);
        mapLayers[3] = map.createStaticLayer('Items', mapTiles).setScale(4, 4);

        logo = this.add.sprite(window.innerWidth >> 1, window.innerHeight >> 1, 'logo').setScale(2, 2).setScrollFactor(0);
        
        this.cameras.main.setBounds(0, 0, map.widthInPixels * 4, map.heightInPixels * 4);
    }

    update() {
        position++;
        this.cameras.main.setZoom(cameraScale);
        logo.angle = (position / 2.0) % 360;
        this.cameras.main.setScroll(position,position);
    }
}
