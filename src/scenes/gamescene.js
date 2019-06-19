import Phaser from 'phaser';
import testJSON from '../assets/maps/tiled/test.json';
import testTilesPNG from '../assets/images/tiles/test.png';

var map;
var mapTiles;
var mapLayers = [];
var position = 0;
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
        this.cameras.main.setZoom(1);

        map = this.add.tilemap('testMap');
        mapTiles = map.addTilesetImage('test', 'testTiles');
        mapLayers[0] = map.createStaticLayer('Floor', mapTiles).setScale(4, 4);
        mapLayers[1] = map.createStaticLayer('Shadows', mapTiles).setScale(4, 4);
        mapLayers[2] = map.createStaticLayer('Walls', mapTiles).setScale(4, 4);

        // this.add.sprite(320, 256, 'testTiles');
    }

    update() {
        position++;
        this.cameras.main.setScroll(position,position);
    }
}