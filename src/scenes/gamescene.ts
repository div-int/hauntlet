import "phaser";
import { Version } from "../version";
import { Players, Player } from "../players";
import { SpawnPoints, SpawnPoint } from "../spawnpoints";

let testJSON = require("../assets/maps/tiled/level_1.json");
let testTilesPNG = require("../assets/images/tiles/placeholder.png");
let treasureTilesPNG = require("../assets/items/treasure.png");
let knightSpritePNG = require("../assets/images/characters/test.png");
let skeletonSpritePNG = require("../assets/images/characters/skeleton.png");
let ghostSpritePNG = require("../assets/images/characters/ghost.png");
let swordSpritePNG = require("../assets/images/weapons/sword.png");

Players.MaxPlayers = 4;
Players.CreatePlayer("Player 1", 500);

const MAX_GHOSTS: integer = 128;

let map: Phaser.Tilemaps.Tilemap;
let mapTiles: Phaser.Tilemaps.Tileset;
let treasureTiles: Phaser.Tilemaps.Tileset;
let mapLayerFloor: Phaser.Tilemaps.StaticTilemapLayer;
let mapLayerWalls: Phaser.Tilemaps.DynamicTilemapLayer;
let mapLayerExits: Phaser.Tilemaps.StaticTilemapLayer;
let mapLayerItems: Phaser.Tilemaps.DynamicTilemapLayer;
let mapLayerShadows: Phaser.Tilemaps.StaticTilemapLayer;
let mapLayerDoors: Phaser.Tilemaps.DynamicTilemapLayer;
let mapLayerDoorShadows: Phaser.Tilemaps.DynamicTilemapLayer;
let displayScale = 2;
let spriteScale = 2;
let spriteVelocity = 200;
let swordSprites: Phaser.Physics.Arcade.Sprite[] = new Array();
let knightSprite: Phaser.Physics.Arcade.Sprite;
let skeletonSprite: Phaser.Physics.Arcade.Sprite;
let ghostsGroup;
let ghostSprites: Phaser.Physics.Arcade.Sprite[] = new Array();
let knightSpriteDirection = "South";
let knightSpritetakingDamage: Boolean = false;
let cursorKeys: Phaser.Types.Input.Keyboard.CursorKeys;
let fireKey: Phaser.Input.Keyboard.Key;
let firePressed = false;
let fireClicked = false;
let fireGroup;
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
    mapLayerDoorShadows.removeTileAt(location.x, location.y, false, true);
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
    this.load.image("treasureTiles", treasureTilesPNG);
    this.load.spritesheet("knightSprite", knightSpritePNG, {
      frameWidth: 64,
      frameHeight: 64
    });
    this.load.spritesheet("skeletonSprite", skeletonSpritePNG, {
      frameWidth: 64,
      frameHeight: 64
    });
    this.load.spritesheet("ghostSprite", ghostSpritePNG, {
      frameWidth: 32,
      frameHeight: 64
    });
    this.load.spritesheet("swordSprite", swordSpritePNG, {
      frameWidth: 18,
      frameHeight: 18
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
    treasureTiles = map.addTilesetImage("treasure", "treasureTiles");
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
      .createDynamicLayer("Items", treasureTiles)
      .setScale(displayScale, displayScale)
      .setDepth(5);
    mapLayerDoors = map
      .createBlankDynamicLayer("Doors", mapTiles)
      .setScale(displayScale, displayScale)
      .setDepth(10);
    mapLayerDoorShadows = map
      .createDynamicLayer("DoorShadows", mapTiles, 0, 0)
      .setScale(displayScale, displayScale)
      .setDepth(4);

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
    //mapLayerItems.setCollisionByExclusion([-1], true, true);

    this.anims.create({
      key: "knightIdleNorth",
      frames: this.anims.generateFrameNumbers("knightSprite", {
        start: 0,
        end: 0
      }),
      frameRate: 15,
      repeat: -1
    });
    this.anims.create({
      key: "knightIdleWest",
      frames: this.anims.generateFrameNumbers("knightSprite", {
        start: 9,
        end: 18
      }),
      frameRate: 15,
      repeat: -1
    });
    this.anims.create({
      key: "knightIdleSouth",
      frames: this.anims.generateFrameNumbers("knightSprite", {
        start: 18,
        end: 18
      }),
      frameRate: 15,
      repeat: -1
    });
    this.anims.create({
      key: "knightIdleEast",
      frames: this.anims.generateFrameNumbers("knightSprite", {
        start: 27,
        end: 18
      }),
      frameRate: 15,
      repeat: -1
    });
    this.anims.create({
      key: "knightWalkNorth",
      frames: this.anims.generateFrameNumbers("knightSprite", {
        start: 1,
        end: 8
      }),
      frameRate: 15,
      repeat: -1
    });
    this.anims.create({
      key: "knightWalkWest",
      frames: this.anims.generateFrameNumbers("knightSprite", {
        start: 10,
        end: 17
      }),
      frameRate: 15,
      repeat: -1
    });
    this.anims.create({
      key: "knightWalkSouth",
      frames: this.anims.generateFrameNumbers("knightSprite", {
        start: 19,
        end: 26
      }),
      frameRate: 15,
      repeat: -1
    });
    this.anims.create({
      key: "knightWalkEast",
      frames: this.anims.generateFrameNumbers("knightSprite", {
        start: 28,
        end: 35
      }),
      frameRate: 15,
      repeat: -1
    });

    this.anims.create({
      key: "skeletonIdleNorth",
      frames: this.anims.generateFrameNumbers("skeletonSprite", {
        start: 0 + 0 * 13,
        end: 6 + 0 * 13
      }),
      frameRate: 15,
      repeat: -1
    });
    this.anims.create({
      key: "skeletonIdleWest",
      frames: this.anims.generateFrameNumbers("skeletonSprite", {
        start: 0 + 1 * 13,
        end: 6 + 1 * 13
      }),
      frameRate: 15,
      repeat: -1
    });
    this.anims.create({
      key: "skeletonIdleSouth",
      frames: this.anims.generateFrameNumbers("skeletonSprite", {
        start: 0 + 2 * 13,
        end: 6 + 2 * 13
      }),
      frameRate: 15,
      repeat: -1
    });
    this.anims.create({
      key: "skeletonIdleEast",
      frames: this.anims.generateFrameNumbers("skeletonSprite", {
        start: 0 + 3 * 13,
        end: 6 + 3 * 13
      }),
      frameRate: 15,
      repeat: -1
    });
    this.anims.create({
      key: "skeletonWalkNorth",
      frames: this.anims.generateFrameNumbers("skeletonSprite", {
        start: 0 + 8 * 13,
        end: 8 + 8 * 13
      }),
      frameRate: 15,
      repeat: -1
    });
    this.anims.create({
      key: "skeletonWalkWest",
      frames: this.anims.generateFrameNumbers("skeletonSprite", {
        start: 0 + 9 * 13,
        end: 8 + 9 * 13
      }),
      frameRate: 15,
      repeat: -1
    });
    this.anims.create({
      key: "skeletonWalkSouth",
      frames: this.anims.generateFrameNumbers("skeletonSprite", {
        start: 0 + 10 * 13,
        end: 8 + 10 * 13
      }),
      frameRate: 15,
      repeat: -1
    });
    this.anims.create({
      key: "skeletonWalkEast",
      frames: this.anims.generateFrameNumbers("skeletonSprite", {
        start: 0 + 11 * 13,
        end: 8 + 11 * 13
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

    knightSprite = this.physics.add
      .sprite(
        SpawnPoints.SpawnPoint("Player 1").X,
        SpawnPoints.SpawnPoint("Player 1").Y,
        "knightSprite",
        2
      )
      .setScrollFactor(1, 1)
      .setDepth(7);

    knightSprite
      .setSize(20, 32)
      .setOffset(28, 32)
      .setScale(spriteScale, spriteScale)
      .setMaxVelocity(spriteVelocity)
      .setCollideWorldBounds(true)
      .anims.play("knightIdleSouth");
    knightSprite.name = "Player";

    fireGroup = this.physics.add.group({
      immovable: false,
      bounceX: 0,
      bounceY: 0
    });

    this.physics.add.collider(
      fireGroup,
      mapLayerWalls,
      (sword: Phaser.Physics.Arcade.Sprite, tile) => {
        //console.log(sword, tile);
        sword.destroy();
      }
    );
    this.physics.add.collider(
      fireGroup,
      mapLayerDoors,
      (sword: Phaser.Physics.Arcade.Sprite, door) => {
        sword.destroy();
      }
    );

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
      bounceX: 0.0,
      bounceY: 0.0
    });

    for (let i = 0; i < MAX_GHOSTS; i++) {
      ghostSprites[i] = this.physics.add
        .sprite(
          Phaser.Math.Between(16, 128) * 32,
          Phaser.Math.Between(16, 128) * 32,
          "skeletonSprite", //"ghostSprite",
          0
        )
        .setAlpha(1.0) //.setAlpha(0.7)
        .setScrollFactor(1, 1)
        .setDepth(5)
        .setSize(24, 32)
        .setOffset(24, 32)
        .setScale(spriteScale, spriteScale) //.setScale(spriteScale * 2, spriteScale)
        .setMaxVelocity(100);
      ghostSprites[i].name = "Ghost";
      ghostSprites[i].setCollideWorldBounds(true);
      ghostSprites[i].play(
        "skeletonWalkSouth",
        false,
        Phaser.Math.Between(0, 8)
      );
      ghostsGroup.add(ghostSprites[i], false);
    }

    this.physics.add.collider(knightSprite, mapLayerWalls);
    this.physics.add.collider(ghostsGroup, mapLayerWalls);
    this.physics.add.collider(
      knightSprite,
      mapLayerDoors,
      (o1: any, o2: any) => {
        if (o1.name === "Player") {
          removeDoor(findDoorAt(o2.x, o2.y));
          // @ts-ignore
          //console.log(o2.index, o2.x, o2.y);
        }
      },
      null,
      this
    );

    this.physics.add.overlap(
      knightSprite,
      mapLayerItems,
      (knight: Phaser.Physics.Arcade.Sprite, item: any) => {
        if (item.index != -1) {
          //console.log(knight, item);
          mapLayerItems.removeTileAt(item.x, item.y);
        }
      }
    );

    this.physics.add.collider(
      ghostsGroup,
      fireGroup,
      (
        ghost: Phaser.Physics.Arcade.Sprite,
        sword: Phaser.Physics.Arcade.Sprite
      ) => {
        //console.log(ghost, sword);
        sword.destroy();
        ghost.destroy();
      }
    );

    this.physics.add.collider(ghostsGroup, mapLayerDoors);
    this.physics.add.collider(
      knightSprite,
      ghostsGroup,
      (o1: Phaser.Physics.Arcade.Sprite, o2: Phaser.Physics.Arcade.Sprite) => {
        if (knightSpritetakingDamage === false) {
          knightSpritetakingDamage = true;
          this.time.delayedCall(
            50,
            () => {
              knightSprite.tint = 0xff0000;
              this.time.delayedCall(
                50,
                () => {
                  knightSpritetakingDamage = false;
                  knightSprite.tint = 0xffffff;
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
    fireKey = this.input.keyboard.addKey("A");

    this.cameras.main.setBounds(
      0,
      0,
      map.widthInPixels * displayScale,
      map.heightInPixels * displayScale
    );
    this.cameras.main.startFollow(knightSprite, false, 0.8, 0.8, 0.5, 0.5);
  }

  update() {
    let pointer = this.input.activePointer;
    let moveLeft = false;
    let moveRight = false;
    let moveUp = false;
    let moveDown = false;
    let fireDirection = 0;
    let moving = false;

    if (pointer.isDown) {
      let touchX = pointer.x;
      let touchY = pointer.y;
      let worldPoint = this.cameras.main.getWorldPoint(touchX, touchY);

      if (worldPoint.x >> 4 < knightSprite.x >> 4) {
        moveLeft = true;
        moveRight = false;
        if (!fireClicked) {
          fireDirection |= 4;
        }
      } else if (worldPoint.x >> 4 > knightSprite.x >> 4) {
        moveLeft = false;
        moveRight = true;
        if (!fireClicked) {
          fireDirection |= 1;
        }
      }

      if (worldPoint.y >> 4 < knightSprite.y >> 4) {
        moveUp = true;
        moveDown = false;
        if (!fireClicked) {
          fireDirection |= 8;
        }
      } else if (worldPoint.y >> 4 > knightSprite.y >> 4) {
        moveUp = false;
        moveDown = true;
        if (!fireClicked) {
          fireDirection |= 2;
        }
      }
      fireClicked = true;
    } else {
      fireClicked = false;
    }

    knightSprite.setDepth(
      100 + knightSprite.x + knightSprite.y * map.widthInPixels
    );

    if (fireKey.isUp) {
      firePressed = false;
    }

    if (cursorKeys.right.isDown || moveRight) {
      if (fireKey.isUp) {
        knightSprite.setVelocityX(spriteVelocity);
        if (knightSprite.anims.currentAnim.key != "knightWalkEast" && !moving) {
          knightSprite.anims.play("knightWalkEast");
        }
        knightSpriteDirection = "East";
        moving = true;
      }
      if (fireKey.isDown && !firePressed) {
        knightSprite.setVelocityX(0);
        fireDirection |= 1;
      }
    } else if (cursorKeys.left.isDown || moveLeft) {
      if (fireKey.isUp) {
        knightSprite.setVelocityX(-spriteVelocity);
        if (knightSprite.anims.currentAnim.key != "knightWalkWest" && !moving) {
          knightSprite.anims.play("knightWalkWest");
        }
        knightSpriteDirection = "West";
        moving = true;
      }
      if (fireKey.isDown && !firePressed) {
        knightSprite.setVelocityX(0);
        fireDirection |= 4;
      }
    } else {
      knightSprite.setVelocityX(0);
      moving = false;
    }

    if (cursorKeys.up.isDown || moveUp) {
      knightSprite.setVelocityY(-spriteVelocity);
      if (fireKey.isDown && !firePressed) {
        knightSprite.setVelocityY(0);
        fireDirection |= 8;
        firePressed = true;
      }
      if (
        knightSprite.anims.currentAnim.key != "knightWalkNorth" &&
        moving === false
      ) {
        knightSprite.anims.play("knightWalkNorth");
      }
      knightSpriteDirection = "North";
      moving = true;
    } else if (cursorKeys.down.isDown || moveDown) {
      knightSprite.setVelocityY(spriteVelocity);
      if (fireKey.isDown && !firePressed) {
        knightSprite.setVelocityY(0);
        fireDirection |= 2;
        firePressed = true;
      }
      if (
        knightSprite.anims.currentAnim.key != "knightWalkSouth" &&
        moving === false
      ) {
        knightSprite.anims.play("knightWalkSouth");
      }
      knightSpriteDirection = "South";
      moving = true;
    } else {
      knightSprite.setVelocityY(0);
    }

    if (fireKey.isDown) {
      firePressed = true;
    }

    if (moving === true) {
      knightSprite.anims.msPerFrame = 75;
    } else {
      knightSprite.anims.msPerFrame = 150;
    }

    if (
      Math.abs(knightSprite.body.velocity.x) +
        Math.abs(knightSprite.body.velocity.y) ===
      0
    ) {
      knightSprite.anims.play("knightIdle" + knightSpriteDirection);
    }

    if (fireDirection) {
      let fireFrame = 4;
      let vx = 0;
      let vy = 0;

      if (fireDirection & 1) {
        vx = 500;
        fireFrame++;
      }
      if (fireDirection & 2) {
        vy = 500;
        fireFrame += 3;
      }
      if (fireDirection & 4) {
        vx = -500;
        fireFrame--;
      }
      if (fireDirection & 8) {
        vy = -500;
        fireFrame -= 3;
      }

      let newSword = this.physics.add.sprite(
        knightSprite.x,
        knightSprite.y + 8 * spriteScale,
        "swordSprite",
        fireFrame
      );
      fireGroup.add(newSword, false);

      newSword
        .setDepth(6)
        .setScale(spriteScale, spriteScale)
        .setVelocityX(vx)
        .setVelocityY(vy)
        .setCollideWorldBounds(true);

      firePressed = true;
    }

    let ghostXDiff, ghostYDiff;

    for (let i = 0; i < MAX_GHOSTS; i++) {
      //console.log(ghostSprites[i]);
      if (ghostSprites[i].active) {
        ghostSprites[i].setDepth(
          100 + ghostSprites[i].x + ghostSprites[i].y * map.widthInPixels
        );
        ghostXDiff = ghostSprites[i].x - knightSprite.x;
        ghostYDiff = ghostSprites[i].y - knightSprite.y;

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
            if (ghostSprites[i].anims.currentAnim.key != "skeletonWalkEast") {
              ghostSprites[i].anims.play(
                "skeletonWalkEast",
                false,
                Phaser.Math.Between(0, 8)
              );
            }
          } else {
            if (ghostSprites[i].anims.currentAnim.key != "skeletonWalkWest") {
              ghostSprites[i].anims.play(
                "skeletonWalkWest",
                false,
                Phaser.Math.Between(0, 8)
              );
            }
          }
        } else {
          if (ghostYDiff < 0) {
            if (ghostSprites[i].anims.currentAnim.key != "skeletonWalkSouth") {
              ghostSprites[i].anims.play(
                "skeletonWalkSouth",
                false,
                Phaser.Math.Between(0, 8)
              );
            }
          } else {
            if (ghostSprites[i].anims.currentAnim.key != "skeletonWalkNorth") {
              ghostSprites[i].anims.play(
                "skeletonWalkNorth",
                false,
                Phaser.Math.Between(0, 8)
              );
            }
          }
        }
      }
    }
  }
}
