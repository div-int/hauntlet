import "phaser";
import { Version } from "../version";
import { Players, Player } from "../players";
import { SpawnPoints, SpawnPoint } from "../spawnpoints";

let testJSON = require("../assets/maps/tiled/test.json");
let testTilesPNG = require("../assets/images/tiles/placeholder.png");
let testSpritePNG = require("../assets/images/characters/test.png");
let ghostSpritePNG = require("../assets/images/characters/ghost.png");

Players.MaxPlayers = 4;
Players.CreatePlayer("Player 1", 500);

const MAX_GHOSTS: integer = 100;

let map: Phaser.Tilemaps.Tilemap;
let mapTiles: Phaser.Tilemaps.Tileset;
let mapLayerFloor: Phaser.Tilemaps.StaticTilemapLayer;
let mapLayerWalls: Phaser.Tilemaps.DynamicTilemapLayer;
let mapLayerExits: Phaser.Tilemaps.StaticTilemapLayer;
let mapLayerItems: Phaser.Tilemaps.StaticTilemapLayer;
let mapLayerShadows: Phaser.Tilemaps.StaticTilemapLayer;
let mapLayerDoors: Phaser.Tilemaps.DynamicTilemapLayer;
let mapLayerRoof: Phaser.Tilemaps.StaticTilemapLayer;
let mapLayerRoofWalls: Phaser.Tilemaps.StaticTilemapLayer;
let mapLayerRoofShadows: Phaser.Tilemaps.StaticTilemapLayer;
let displayScale = 2;
let spriteScale = 1;
let spriteVelocity = 200;
let testSprite: Phaser.Physics.Arcade.Sprite;
let ghostsGroup;
let ghostSprites: Phaser.Physics.Arcade.Sprite[] = new Array();
let testSpriteDirection = "South";
let testSpritetakingDamage: Boolean = false;
let cursorKeys: Phaser.Types.Input.Keyboard.CursorKeys;
let doors = [];

function findDoorAt(x, y) {
  let foundDoorId: string;

  Object.entries(doors).forEach(door => {
    door[1].forEach(location => {
      if (x === location.x && y === location.y) {
        foundDoorId = door[0];
      }
    });
  });

  return foundDoorId;
}

function removeDoor(doorId) {
  console.log(`removeDoor(${doorId})`);
  doors[doorId].forEach(location => {
    mapLayerDoors.removeTileAt(location.x, location.y, false, true);
  });
}

export default class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");

    console.log(`GameScene::constructor() : ${Version}`);
  }

  preload() {
    this.load.tilemapTiledJSON("testMap", testJSON);
    this.load.image("testTiles", testTilesPNG);
    this.load.spritesheet("testSprite", testSpritePNG, {
      frameWidth: 64,
      frameHeight: 64
    });
    this.load.spritesheet("ghostSprite", ghostSpritePNG, {
      frameWidth: 32,
      frameHeight: 64
    });
  }

  create() {
    this.add
      .text(4, 4, `Version : ${Version}`, { fontSize: "16px", fill: "#000" })
      .setDepth(20000000)
      .setScrollFactor(0, 0);
    this.add
      .text(3, 3, `Version : ${Version}`, { fontSize: "16px", fill: "#fff" })
      .setDepth(20000001)
      .setScrollFactor(0, 0);

    map = this.add.tilemap("testMap");
    mapTiles = map.addTilesetImage("test", "testTiles");
    mapLayerFloor = map
      .createStaticLayer("Floor", mapTiles)
      .setScale(displayScale, displayScale)
      .setDepth(1);
    mapLayerWalls = map
      .createDynamicLayer("Walls", mapTiles, 0, 0)
      .setScale(displayScale, displayScale)
      .setDepth(2);
    mapLayerExits = map
      .createStaticLayer("Exits", mapTiles)
      .setScale(displayScale, displayScale)
      .setDepth(3);
    mapLayerShadows = map
      .createStaticLayer("Shadows", mapTiles)
      .setScale(displayScale, displayScale)
      .setDepth(4);
    mapLayerItems = map
      .createStaticLayer("Items", mapTiles)
      .setScale(displayScale, displayScale)
      .setDepth(5);
    mapLayerDoors = map
      .createBlankDynamicLayer("Doors", mapTiles)
      .setScale(displayScale, displayScale)
      .setDepth(6);
    mapLayerRoof = map
      .createStaticLayer("Roof", mapTiles)
      .setScale(displayScale, displayScale)
      .setDepth(100000000);
    mapLayerRoofShadows = map
      .createStaticLayer("RoofShadows", mapTiles)
      .setX(16 * displayScale)
      .setY(16 * displayScale)
      .setScale(displayScale, displayScale)
      .setDepth(100000001);
    mapLayerRoofWalls = map
      .createStaticLayer("RoofWalls", mapTiles)
      .setX(32)
      .setY(32)
      .setScale(displayScale, displayScale)
      .setDepth(100000002);

    const objects = map.findObject("Doors", o => {
      // @ts-ignore
      console.log(`${o.gid},${o.name},${o.type},${o.x >> 5},${(o.y >> 5) - 1}`);
      // @ts-ignore
      mapLayerDoors.putTileAt(o.gid, o.x >> 5, (o.y >> 5) - 1);
      // @ts-ignore
      if (typeof doors[o.name] == "undefined") {
        // @ts-ignore
        doors[o.name] = new Array();
      }
      // @ts-ignore
      doors[o.name].push({
        // @ts-ignore
        x: o.x >> 5,
        // @ts-ignore
        y: (o.y >> 5) - 1
      });
    });

    map.findObject("PlayerSpawns", o => {
      SpawnPoints.Add(
        // @ts-ignore
        new SpawnPoint(o.name, o.x * displayScale, o.y * displayScale)
      );
    });

    mapLayerWalls.setCollisionByExclusion([-1], true, true);
    mapLayerDoors.setCollisionByExclusion([-1], true, true);

    this.anims.create({
      key: "idleNorth",
      frames: this.anims.generateFrameNumbers("testSprite", {
        start: 0,
        end: 0
      }),
      frameRate: 15,
      repeat: -1
    });
    this.anims.create({
      key: "idleWest",
      frames: this.anims.generateFrameNumbers("testSprite", {
        start: 9,
        end: 18
      }),
      frameRate: 15,
      repeat: -1
    });
    this.anims.create({
      key: "idleSouth",
      frames: this.anims.generateFrameNumbers("testSprite", {
        start: 18,
        end: 18
      }),
      frameRate: 15,
      repeat: -1
    });
    this.anims.create({
      key: "idleEast",
      frames: this.anims.generateFrameNumbers("testSprite", {
        start: 27,
        end: 18
      }),
      frameRate: 15,
      repeat: -1
    });
    this.anims.create({
      key: "walkNorth",
      frames: this.anims.generateFrameNumbers("testSprite", {
        start: 1,
        end: 8
      }),
      frameRate: 15,
      repeat: -1
    });
    this.anims.create({
      key: "walkWest",
      frames: this.anims.generateFrameNumbers("testSprite", {
        start: 10,
        end: 17
      }),
      frameRate: 15,
      repeat: -1
    });
    this.anims.create({
      key: "walkSouth",
      frames: this.anims.generateFrameNumbers("testSprite", {
        start: 19,
        end: 26
      }),
      frameRate: 15,
      repeat: -1
    });
    this.anims.create({
      key: "walkEast",
      frames: this.anims.generateFrameNumbers("testSprite", {
        start: 28,
        end: 35
      }),
      frameRate: 15,
      repeat: -1
    });

    this.physics.world.setBounds(
      0,
      0,
      map.widthInPixels * displayScale,
      map.heightInPixels * displayScale
    );

    testSprite = this.physics.add
      .sprite(
        SpawnPoints.SpawnPoint("Player 1").X,
        SpawnPoints.SpawnPoint("Player 1").Y,
        "testSprite",
        2
      )
      .setScrollFactor(1, 1)
      .setDepth(5);

    testSprite
      .setSize(20, 32)
      .setOffset(28, 32)
      .setScale(spriteScale, spriteScale)
      .setMaxVelocity(spriteVelocity)
      .setCollideWorldBounds(true)
      .anims.play("idleSouth");
    testSprite.name = "Player"

    this.anims.create({
      key: "ghostMoveSouth",
      frames: this.anims.generateFrameNumbers("ghostSprite", {
        start: 0,
        end: 2
      }),
      frameRate: 5,
      repeat: -1
    });
    this.anims.create({
      key: "ghostMoveWest",
      frames: this.anims.generateFrameNumbers("ghostSprite", {
        start: 3,
        end: 5
      }),
      frameRate: 5,
      repeat: -1
    });
    this.anims.create({
      key: "ghostMoveEast",
      frames: this.anims.generateFrameNumbers("ghostSprite", {
        start: 6,
        end: 8
      }),
      frameRate: 5,
      repeat: -1
    });
    this.anims.create({
      key: "ghostMoveNorth",
      frames: this.anims.generateFrameNumbers("ghostSprite", {
        start: 9,
        end: 11
      }),
      frameRate: 5,
      repeat: -1
    });

    ghostsGroup = this.physics.add.group({
      immovable: false,
      bounceX: 1,
      bounceY: 1
    });

    for (let i = 0; i < MAX_GHOSTS; i++) {
      ghostSprites[i] = this.physics.add
        .sprite(
          Phaser.Math.Between(32, 64) * 32,
          Phaser.Math.Between(32, 64) * 32,
          "ghostSprite",
          0
        )
        .setAlpha(0.7)
        .setScrollFactor(1, 1)
        .setDepth(5)
        .setSize(16, 32)
        .setOffset(14, 32)
        .setScale(spriteScale * 2, spriteScale)
        .setMaxVelocity(50);
      ghostSprites[i].name = "Ghost";
      ghostSprites[i].anims.play("ghostMoveSouth");
      ghostSprites[i].setCollideWorldBounds(true);
      ghostsGroup.add(ghostSprites[i], false);
    }

    this.physics.add.collider(testSprite, mapLayerWalls);
    this.physics.add.collider(ghostsGroup, mapLayerWalls);
    this.physics.add.collider(
      testSprite,
      mapLayerDoors,
      (o1, o2) => {
        if (o1.name === "Player") {
          // @ts-ignore
          removeDoor(findDoorAt(o2.x, o2.y));
          // @ts-ignore
          console.log(o2.index, o2.x, o2.y);
        }
      },
      null,
      this
    );
    this.physics.add.collider(ghostsGroup, mapLayerDoors);
    this.physics.add.collider(
      testSprite,
      ghostsGroup,
      (o1: Phaser.Physics.Arcade.Sprite, o2: Phaser.Physics.Arcade.Sprite) => {
        if (testSpritetakingDamage === false) {
          testSpritetakingDamage = true;
          this.time.delayedCall(
            50,
            () => {
              testSprite.tint = 0xff0000;
              this.time.delayedCall(
                50,
                () => {
                  testSpritetakingDamage = false;
                  testSprite.tint = 0xffffff;
                },
                null,
                this
              );
            },
            null,
            this
          );
          console.log("Ghost and player collided");
        }
      },
      null,
      this
    );
    this.physics.add.collider(ghostsGroup, ghostsGroup);

    cursorKeys = this.input.keyboard.createCursorKeys();

    this.cameras.main.setBounds(
      0,
      0,
      map.widthInPixels * displayScale,
      map.heightInPixels * displayScale
    );
    this.cameras.main.startFollow(testSprite, false, 0.8, 0.8, 0.5, 0.5);
  }

  update() {
    let pointer = this.input.activePointer;
    let moveLeft = false;
    let moveRight = false;
    let moveUp = false;
    let moveDown = false;

    if (pointer.isDown) {
      let touchX = pointer.x;
      let touchY = pointer.y;
      let worldPoint = this.cameras.main.getWorldPoint(touchX, touchY);

      if (worldPoint.x >> 4 < testSprite.x >> 4) {
        moveLeft = true;
        moveRight = false;
      } else if (worldPoint.x >> 4 > testSprite.x >> 4) {
        moveLeft = false;
        moveRight = true;
      }

      if (worldPoint.y >> 4 < testSprite.y >> 4) {
        moveUp = true;
        moveDown = false;
      } else if (worldPoint.y >> 4 > testSprite.y >> 4) {
        moveUp = false;
        moveDown = true;
      }
    }

    let moving = false;

    testSprite.setDepth(100 + testSprite.x + testSprite.y * map.widthInPixels);

    if (cursorKeys.right.isDown || moveRight) {
      testSprite.setAccelerationX(spriteVelocity);
      if (testSprite.anims.currentAnim.key != "walkEast" && moving === false) {
        testSprite.anims.play("walkEast");
      }
      testSpriteDirection = "East";
      moving = true;
    } else if (cursorKeys.left.isDown || moveLeft) {
      testSprite.setAccelerationX(-spriteVelocity);
      if (testSprite.anims.currentAnim.key != "walkWest" && moving === false) {
        testSprite.anims.play("walkWest");
      }
      testSpriteDirection = "West";
      moving = true;
    } else {
      testSprite.setAccelerationX(0);
      testSprite.setDamping(true);
      testSprite.setDrag(0.25);
      moving = false;
    }

    if (cursorKeys.up.isDown || moveUp) {
      testSprite.setAccelerationY(-spriteVelocity);
      if (testSprite.anims.currentAnim.key != "walkNorth" && moving === false) {
        testSprite.anims.play("walkNorth");
      }
      testSpriteDirection = "North";
      moving = true;
    } else if (cursorKeys.down.isDown || moveDown) {
      testSprite.setAccelerationY(spriteVelocity);
      if (testSprite.anims.currentAnim.key != "walkSouth" && moving === false) {
        testSprite.anims.play("walkSouth");
      }
      testSpriteDirection = "South";
      moving = true;
    } else {
      testSprite.setAccelerationY(0);
      testSprite.setDamping(true);
      testSprite.setDrag(0.25);
      testSprite.anims.msPerFrame = 300;
    }

    if (moving === true) {
      testSprite.anims.msPerFrame = 75;
    } else {
      testSprite.anims.msPerFrame = 150;
    }

    if (
      Math.abs(testSprite.body.velocity.x) +
        Math.abs(testSprite.body.velocity.y) ===
      0
    ) {
      testSprite.anims.play("idle" + testSpriteDirection);
    }

    let ghostXDiff, ghostYDiff;

    for (let i = 0; i < MAX_GHOSTS; i++) {
      ghostSprites[i].setDepth(
        100 + ghostSprites[i].x + ghostSprites[i].y * map.widthInPixels
      );
      ghostXDiff = ghostSprites[i].x - testSprite.x;
      ghostYDiff = ghostSprites[i].y - testSprite.y;

      if (ghostXDiff < 16) {
        ghostSprites[i].setDamping(false);
        ghostSprites[i].setAccelerationX(Phaser.Math.Between(10, 100));
      } else if (ghostXDiff > 16) {
        ghostSprites[i].setDamping(false);
        ghostSprites[i].setAccelerationX(-Phaser.Math.Between(10, 100));
      } else {
        ghostSprites[i].setAccelerationX(0);
        ghostSprites[i].setDamping(true);
        ghostSprites[i].setDrag(0.25);
      }
      if (ghostYDiff < 16) {
        ghostSprites[i].setDamping(false);
        ghostSprites[i].setAccelerationY(Phaser.Math.Between(10, 100));
      } else if (ghostYDiff > 16) {
        ghostSprites[i].setDamping(false);
        ghostSprites[i].setAccelerationY(-Phaser.Math.Between(10, 100));
      } else {
        ghostSprites[i].setAccelerationY(0);
        ghostSprites[i].setDamping(true);
        ghostSprites[i].setDrag(0.25);
      }

      if (Math.abs(ghostXDiff) > Math.abs(ghostYDiff)) {
        if (ghostXDiff < 0) {
          if (ghostSprites[i].anims.currentAnim.key != "ghostMoveEast") {
            ghostSprites[i].anims.play("ghostMoveEast");
          }
        } else {
          if (ghostSprites[i].anims.currentAnim.key != "ghostMoveWest") {
            ghostSprites[i].anims.play("ghostMoveWest");
          }
        }
      } else {
        if (ghostYDiff < 0) {
          if (ghostSprites[i].anims.currentAnim.key != "ghostMoveSouth") {
            ghostSprites[i].anims.play("ghostMoveSouth");
          }
        } else {
          if (ghostSprites[i].anims.currentAnim.key != "ghostMoveNorth") {
            ghostSprites[i].anims.play("ghostMoveNorth");
          }
        }
      }
    }
  }
}
