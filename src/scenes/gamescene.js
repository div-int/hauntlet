import Phaser from 'phaser';
import testJSON from '../assets/maps/tiled/test.json';
import testTilesPNG from '../assets/images/tiles/test.png';

var map;
var mapTiles;
var mapLayers = [];
var position = 0;
var cameraScale = 0.5

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    preload() {
        console.log('GameScene::preload()');

        this.load.tilemapTiledJSON('testMap', testJSON);
        this.load.image('testTiles', testTilesPNG);
    }

    create() {
        this.cameras.main.setZoom(cameraScale);

        map = this.add.tilemap('testMap');
        mapTiles = map.addTilesetImage('test', 'testTiles');
        mapLayers[0] = map.createStaticLayer('Floor', mapTiles).setScale(4,4);
        mapLayers[1] = map.createStaticLayer('Shadows', mapTiles).setScale(4, 4);
        mapLayers[2] = map.createStaticLayer('Walls', mapTiles).setScale(4, 4);
        mapLayers[3] = map.createStaticLayer('Items', mapTiles).setScale(4, 4);

        this.cameras.main.setBounds(0, 0, map.widthInPixels * 4, map.heightInPixels * 4);
    }

    update() {
        position++;
        this.cameras.main.setScroll(position,position);
    }
}
