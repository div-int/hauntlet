import Phaser from 'phaser';
import testJSON from '../assets/maps/tiled/test.json';
import testTilesPNG from '../assets/images/tiles/test.extruded.png';
import testSpritePNG from '../assets/images/characters/test.png';
import ghostSpritePNG from '../assets/images/characters/ghost.png';
import logoPNG from '../assets/images/logo.png';

var map;
var mapTiles;
var mapLayers = [];
var displayScale = 4;
var spriteScale = 2;
var spriteVelocity = 150;
var logo;
var testSprite;
var ghostsGroup, ghostSprites = [], maxGhosts = 100;
var testSpriteDirection = 'South';
var cursorKeys;

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    preload() {
        this.load.tilemapTiledJSON('testMap', testJSON);

        this.load.image('testTiles', testTilesPNG);
        this.load.image('logo', logoPNG);

        this.load.spritesheet('testSprite', testSpritePNG, { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet('ghostSprite', ghostSpritePNG, { frameWidth: 32, frameHeight: 64 })
    }

    create() {
        map = this.add.tilemap('testMap');
        
        mapTiles = map.addTilesetImage('test', 'testTiles');
        mapLayers[0] = map.createStaticLayer('Floor', mapTiles).setScale(displayScale, displayScale).setDepth(1);
        mapLayers[1] = map.createStaticLayer('Shadows', mapTiles).setScale(displayScale, displayScale).setDepth(4);
        mapLayers[2] = map.createDynamicLayer('Walls', mapTiles).setScale(displayScale, displayScale).setDepth(2);
        mapLayers[3] = map.createStaticLayer('Exits', mapTiles).setScale(displayScale, displayScale).setDepth(3);
        mapLayers[4] = map.createStaticLayer('Items', mapTiles).setScale(displayScale, displayScale).setDepth(5);

        mapLayers[2].setCollisionByExclusion([-1], true, true);

        logo = this.add.sprite(window.innerWidth >> 1, window.innerHeight >> 2, 'logo').setScale(displayScale, displayScale).setScrollFactor(0).setDepth(10000);

        this.anims.create({
            key: 'idleNorth',
            frames: this.anims.generateFrameNumbers('testSprite', { start: 0, end: 0 }),
            frameRate: 15,
            repeat: -1
        });
        this.anims.create({
            key: 'idleWest',
            frames: this.anims.generateFrameNumbers('testSprite', { start: 9, end: 18 }),
            frameRate: 15,
            repeat: -1
        });
        this.anims.create({
            key: 'idleSouth',
            frames: this.anims.generateFrameNumbers('testSprite', { start: 18, end: 18 }),
            frameRate: 15,
            repeat: -1
        });
        this.anims.create({
            key: 'idleEast',
            frames: this.anims.generateFrameNumbers('testSprite', { start: 27, end: 18 }),
            frameRate: 15,
            repeat: -1
        });
        this.anims.create({
            key: 'walkNorth',
            frames: this.anims.generateFrameNumbers('testSprite', { start: 1, end: 8 }),
            frameRate: 15,
            repeat: -1
        });
        this.anims.create({
            key: 'walkWest',
            frames: this.anims.generateFrameNumbers('testSprite', { start: 10, end: 17 }),
            frameRate: 15,
            repeat: -1
        });
        this.anims.create({
            key: 'walkSouth',
            frames: this.anims.generateFrameNumbers('testSprite', { start: 19, end: 26 }),
            frameRate: 15,
            repeat: -1
        });
        this.anims.create({
            key: 'walkEast',
            frames: this.anims.generateFrameNumbers('testSprite', { start: 28, end: 35 }),
            frameRate: 15,
            repeat: -1
        });

        this.physics.world.setBounds(0, 0, map.widthInPixels * displayScale, map.heightInPixels * displayScale);

        testSprite = this.physics.add.sprite(320, 320, 'testSprite', 2).setScrollFactor(1, 1).setDepth(5);        
        testSprite.body.setSize(20, 32);
        testSprite.body.setOffset(28, 32);
        testSprite.setScale(spriteScale, spriteScale);
        testSprite.anims.play('idleSouth');
        testSprite.body.setCollideWorldBounds(true);
        testSprite.body.setMaxVelocity(spriteVelocity);

        this.anims.create({
            key: 'ghostMoveSouth',
            frames: this.anims.generateFrameNumbers('ghostSprite', { start: 0, end: 2 }),
            frameRate: 5,
            repeat: -1

        });
        this.anims.create({
            key: 'ghostMoveWest',
            frames: this.anims.generateFrameNumbers('ghostSprite', { start: 3, end: 5 }),
            frameRate: 5,
            repeat: -1

        });
        this.anims.create({
            key: 'ghostMoveEast',
            frames: this.anims.generateFrameNumbers('ghostSprite', { start: 6, end: 8 }),
            frameRate: 5,
            repeat: -1

        });
        this.anims.create({
            key: 'ghostMoveNorth',
            frames: this.anims.generateFrameNumbers('ghostSprite', { start: 9, end: 11 }),
            frameRate: 5,
            repeat: -1

        });

        ghostsGroup = this.physics.add.group({
            immovable: false,
            bounceX: 1,
            bounceY: 1
        });

        for (var i = 0; i < maxGhosts; i++) {
            ghostSprites[i] = this.physics.add.sprite(Phaser.Math.Between(32, 64) * 32, Phaser.Math.Between(32, 64) * 32, 'ghostSprite', 0).setAlpha(0.7).setScrollFactor(1, 1).setDepth(5);
            ghostSprites[i].body.setSize(10, 32);
            ghostSprites[i].body.setOffset(14, 32);
            ghostSprites[i].setScale(spriteScale * 2, spriteScale);
            ghostSprites[i].anims.play('ghostMoveSouth');
            ghostSprites[i].body.setCollideWorldBounds(true);
            ghostSprites[i].body.setMaxVelocity(50);    
            ghostsGroup.add(ghostSprites[i], false);
        }

        this.physics.add.collider(testSprite, mapLayers[2]);
        this.physics.add.collider(ghostsGroup, mapLayers[2]);
        this.physics.add.collider(testSprite, ghostsGroup, (o1, o2) => {
            console.log('Ghost and player collided');
        }, null, this);
        this.physics.add.collider(ghostsGroup, ghostsGroup);

        cursorKeys = this.input.keyboard.createCursorKeys();

        this.tweens.add({
            targets: logo,
            scaleX: 1,
            scaleY: 1,
            ease: 'Power2',
            duration: 1000,
            yoyo: -1,
            repeat: -1
        });

        this.cameras.main.setBounds(0, 0, map.widthInPixels * displayScale, map.heightInPixels * displayScale);
        this.cameras.main.startFollow(testSprite, false, 0.8, 0.8, 0.5, 0.5);
    }

    update() {
        var pointer = this.input.activePointer;
        var moveLeft = false;
        var moveRight = false;
        var moveUp = false;
        var moveDown = false;
        
        if (pointer.isDown) {
            var touchX = pointer.x;
            var touchY = pointer.y;
            var worldPoint = this.cameras.main.getWorldPoint(touchX, touchY);

            if (worldPoint.x < testSprite.x) {
                moveLeft = true;
                moveRight = false;
            } else if (worldPoint.x > testSprite.x) {
                moveLeft = false;
                moveRight = true;
            }

            if (worldPoint.y < testSprite.y) {
                moveUp = true;
                moveDown = false;
            } else if (worldPoint.y > testSprite.y) {
                moveUp = false;
                moveDown = true;
            }
        }
        
        var moving = false;
        
        testSprite.setDepth(100 + testSprite.x + (testSprite.y * map.widthInPixels));

        if (cursorKeys.right.isDown || moveRight) {
            testSprite.setAccelerationX(spriteVelocity * 2);
            if ((testSprite.anims.currentAnim.key != 'walkEast') && (moving === false)) { testSprite.anims.play('walkEast'); }
            testSpriteDirection='East';
            moving = true;
        } else if (cursorKeys.left.isDown || moveLeft) {
            testSprite.setAccelerationX(-spriteVelocity * 2);
            if ((testSprite.anims.currentAnim.key != 'walkWest') && (moving === false)) { testSprite.anims.play('walkWest'); }
            testSpriteDirection='West';
            moving = true;
        } else {
            testSprite.setAccelerationX(0);
            testSprite.body.useDamping = true;
            testSprite.setDrag(0.75);
            moving = false;
        }
        
        if (cursorKeys.up.isDown || moveUp) {
            testSprite.setAccelerationY(-spriteVelocity * 2);
            if ((testSprite.anims.currentAnim.key != 'walkNorth') && (moving === false)) { testSprite.anims.play('walkNorth'); }
            testSpriteDirection='North';
            moving = true;
        } else if (cursorKeys.down.isDown || moveDown) {
            testSprite.setAccelerationY(spriteVelocity * 2);
            if ((testSprite.anims.currentAnim.key != 'walkSouth') && (moving === false)) { testSprite.anims.play('walkSouth'); }
            testSpriteDirection='South';
            moving = true;
        } else {
            testSprite.setAccelerationY(0);
            testSprite.body.useDamping = true;
            testSprite.setDrag(0.75);
            testSprite.anims.msPerFrame = 300;
        }

        if (moving === true) {
            testSprite.anims.msPerFrame = 75;
        } else {
            testSprite.anims.msPerFrame = 150;
        }

        if ((Math.abs(testSprite.body.velocity.x) + Math.abs(testSprite.body.velocity.y)) != 0) {
            logo.setAlpha(0);
        } else {
            logo.setAlpha(1);
            testSprite.anims.play('idle' + testSpriteDirection);
        }

        var ghostXDiff, ghostYDiff;

        for (var i = 0; i < maxGhosts; i++) {
            ghostSprites[i].setDepth(100 + ghostSprites[i].x + (ghostSprites[i].y * map.widthInPixels));
            ghostXDiff = ghostSprites[i].x - testSprite.x;
            ghostYDiff = ghostSprites[i].y - testSprite.y;

            if (ghostXDiff < 16) {
                ghostSprites[i].body.useDamping = false;
                ghostSprites[i].setAccelerationX(Phaser.Math.Between(10, 100));
            } else if (ghostXDiff > 16) {
                ghostSprites[i].body.useDamping = false;
                ghostSprites[i].setAccelerationX(-Phaser.Math.Between(10, 100));
            } else {
                ghostSprites[i].setAccelerationX(0);
                ghostSprites[i].body.useDamping = true;
                ghostSprites[i].setDrag(0.25);
            }
            if (ghostYDiff < 16) {
                ghostSprites[i].body.useDamping = false;
                ghostSprites[i].setAccelerationY(Phaser.Math.Between(10, 100));
            } else if (ghostYDiff > 16) {
                ghostSprites[i].body.useDamping = false;
                ghostSprites[i].setAccelerationY(-Phaser.Math.Between(10, 100));
            } else {
                ghostSprites[i].setAccelerationY(0);
                ghostSprites[i].body.useDamping = true;
                ghostSprites[i].setDrag(0.25);
            }

            if (Math.abs(ghostXDiff) > Math.abs(ghostYDiff)) {
                if (ghostXDiff < 0) {
                    if (ghostSprites[i].anims.currentAnim.key != 'ghostMoveEast') { ghostSprites[i].anims.play('ghostMoveEast'); }
                } else {
                    if (ghostSprites[i].anims.currentAnim.key != 'ghostMoveWest') { ghostSprites[i].anims.play('ghostMoveWest'); }
                }
            } else {
                if (ghostYDiff < 0) {
                    if (ghostSprites[i].anims.currentAnim.key != 'ghostMoveSouth') { ghostSprites[i].anims.play('ghostMoveSouth'); }
                } else {
                    if (ghostSprites[i].anims.currentAnim.key != 'ghostMoveNorth') { ghostSprites[i].anims.play('ghostMoveNorth'); }
                }
            }
        }
    }
}
