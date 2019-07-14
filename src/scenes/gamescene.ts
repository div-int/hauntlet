import "phaser";
import { Version } from "../version";
import { Players, Player } from "../players";
import { SpawnPoints, SpawnPoint } from "../spawnpoints";

let levelJSON: any;
let levelTilesPNG = require("../assets/images/tiles/placeholder.extruded.png");
let itemTilesPNG = require("../assets/images/items/treasure.png");
let knightSpritePNG = require("../assets/images/characters/test.png");
let skeletonSpritePNG = require("../assets/images/characters/skeleton.png");
let ghostSpritePNG = require("../assets/images/characters/ghost.png");
let swordSpritePNG = require("../assets/images/weapons/sword.png");
let pressStart2PPNG = require("../assets/images/fonts/press-start-2p_0.png");
let pressStart2PXML = require("../assets/images/fonts/press-start-2p.xml");

Players.MaxPlayers = 4;
Players.CreatePlayer("Player 1", 500);

const MAX_GHOSTS: integer = 128;

let map: Phaser.Tilemaps.Tilemap;
let mapTiles: Phaser.Tilemaps.Tileset;
let itemTiles: Phaser.Tilemaps.Tileset;
let mapLayerFloor: Phaser.Tilemaps.StaticTilemapLayer;
let mapLayerWalls: Phaser.Tilemaps.DynamicTilemapLayer;
let mapLayerExits: Phaser.Tilemaps.StaticTilemapLayer;
let mapLayerItems: Phaser.Tilemaps.DynamicTilemapLayer;
let mapLayerShadows: Phaser.Tilemaps.DynamicTilemapLayer;
let mapLayerDoors: Phaser.Tilemaps.DynamicTilemapLayer;
let mapLayerDoorShadows: Phaser.Tilemaps.DynamicTilemapLayer;
let displayScale = 1;
let spriteScale = 1;
let spriteVelocity = 200;
let swords: Phaser.Physics.Arcade.Sprite[] = new Array();
let knightSprite: Phaser.Physics.Arcade.Sprite;
let skeletonSprite: Phaser.Physics.Arcade.Sprite;
let ghostsGroup;
let deadGhostsGroup;
let ghostSprites: Phaser.Physics.Arcade.Sprite[] = new Array();
let knightSpriteDirection = "South";
let knightSpritetakingDamage: Boolean = false;
let cursorKeys: Phaser.Types.Input.Keyboard.CursorKeys;
let fireKey: Phaser.Input.Keyboard.Key;
let firePressed = false;
let padAPressed = false;
let fireClicked = false;
let fireGroup;
let doors = [];
let keys: number = 0;
let score: number = 0;
let health: number = 800;
let statusText: Phaser.GameObjects.BitmapText;

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
  // console.log(`removeDoor(${doorId})`);
  doors[doorId].forEach(location => {
    mapLayerDoors.removeTileAt(location.x, location.y, false, true);
    mapLayerDoorShadows.removeTileAt(location.x, location.y, false, true);
  });
}

function getDepthFromXY(x: number, y: number): number {
  return x + y * map.widthInPixels;
}

export default class GameScene extends Phaser.Scene {
  private _level: string;

  constructor(level: string) {
    super("GameScene");
    console.log(`GameScene::constructor(${level}) : ${Version}`);

    this._level = level;
  }

  preload() {
    levelJSON = require(`../assets/maps/tiled/${this._level}.json`);
    this.load.bitmapFont("press-start-2p", pressStart2PPNG, pressStart2PXML);
    this.load.tilemapTiledJSON("levelMap", levelJSON);
    this.load.image("levelTiles", levelTilesPNG);
    this.load.image("itemTiles", itemTilesPNG);
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
      frameWidth: 20,
      frameHeight: 20
    });
  }

  create() {
    this.add
      .bitmapText(12, 12, "press-start-2p", `Version : ${Version}`, 8, 0)
      .setDepth(20000001)
      .setScrollFactor(0, 0)
      .setTint(0x00ff00, 0x00ff00, 0x00ffff, 0x00ffff)
      .setScale(2, 2);
    // this.add
    //   .text(8, 8, `Version : ${Version}`, { fontSize: "16px", fill: "#fff" })
    //   .setDepth(20000001)
    //   .setScrollFactor(0, 0);

    statusText = this.add
      .bitmapText(
        12,
        44,
        "press-start-2p",
        "Keys : \x01  x 0 - Score : 0 : Health : \x02  0",
        8,
        0
      )
      .setDepth(20000001)
      .setScrollFactor(0, 0)
      .setScale(2, 2);

    map = this.add.tilemap("levelMap");
    mapTiles = map.addTilesetImage("level", "levelTiles");
    itemTiles = map.addTilesetImage("items", "itemTiles");
    mapLayerFloor = map
      .createStaticLayer("Floor", mapTiles)
      .setScale(displayScale, displayScale)
      .setDepth(1);
    mapLayerWalls = map
      .createDynamicLayer("Walls", mapTiles, 0, 0)
      .setScale(displayScale, displayScale)
      .setDepth(5);
    mapLayerExits = map
      .createStaticLayer("Exits", mapTiles)
      .setScale(displayScale, displayScale)
      .setDepth(2);
    mapLayerShadows = map
      .createDynamicLayer("Shadows", mapTiles)
      .setScale(displayScale, displayScale)
      .setDepth(4);
    mapLayerItems = map
      .createDynamicLayer("Items", itemTiles)
      .setScale(displayScale, displayScale)
      .setDepth(3);
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
      // console.log(`${o.gid},${o.name},${o.type},${o.x >> 5},${(o.y >> 5) - 1}`);
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
    this.anims.create({
      key: "skeletonDie",
      frames: this.anims.generateFrameNumbers("skeletonSprite", {
        start: 0 + 20 * 13,
        end: 5 + 20 * 13
      }),
      frameRate: 15,
      repeat: 0
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
      (sword: Phaser.Physics.Arcade.Sprite, tile: any) => {
        sword.setImmovable(true);
        sword.setAcceleration(0);
        sword.setVelocity(0);
        sword.setFrame(4);
        this.time.delayedCall(
          120,
          (swordHit: Phaser.Physics.Arcade.Sprite) => {
            swordHit.destroy();
          },
          [sword],
          this
        );

        if (tile.properties.destructable) {
          mapLayerWalls.removeTileAt(tile.x, tile.y);
          mapLayerWalls
            .putTileAt(
              tile.properties.alsoIndexMinus + 1,
              tile.x - tile.properties.alsoX,
              tile.y - tile.properties.alsoY,
              true
            )
            .setCollision(true, true, true, true, true);
          mapLayerWalls
            .putTileAt(
              tile.properties.alsoIndexPlus + 1,
              tile.x + tile.properties.alsoX,
              tile.y + tile.properties.alsoY,
              true
            )
            .setCollision(true, true, true, true, true);
          if (tile.properties.alsoY) {
            mapLayerShadows.removeTileAt(tile.x + 1, tile.y);
            mapLayerShadows.putTileAt(
              tile.properties.shadow + 1,
              tile.x,
              tile.y,
              false
            );
            mapLayerShadows.putTileAt(
              tile.properties.shadowX + 1,
              tile.x + 1,
              tile.y,
              false
            );
            mapLayerShadows.putTileAt(
              tile.properties.shadowY + 1,
              tile.x + 1,
              tile.y + 1,
              false
            );
          }
          if (tile.properties.alsoX) {
            mapLayerShadows.removeTileAt(tile.x, tile.y + 1);
            mapLayerShadows.putTileAt(
              tile.properties.shadow + 1,
              tile.x,
              tile.y,
              false
            );
            mapLayerShadows.putTileAt(
              tile.properties.shadowX + 1,
              tile.x + 1,
              tile.y + 1,
              false
            );
            mapLayerShadows.putTileAt(
              tile.properties.shadowY + 1,
              tile.x,
              tile.y + 1,
              false
            );
          }
        }
      }
    );
    this.physics.add.collider(
      fireGroup,
      mapLayerDoors,
      (sword: Phaser.Physics.Arcade.Sprite, door) => {
        sword.setFrame(4);
        this.time.delayedCall(
          120,
          (swordHit: Phaser.Physics.Arcade.Sprite) => {
            swordHit.destroy();
          },
          [sword],
          this
        );
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

    deadGhostsGroup = this.physics.add.group({
      immovable: true,
      bounceX: 0,
      bounceY: 0
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
        if (o1.name === "Player" && keys > 0) {
          removeDoor(findDoorAt(o2.x, o2.y));
          keys--;
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
          if (knight.x >> 5 === item.x && (knight.y - 1) >> 5 === item.y - 1) {
            // console.log(
            //   `Collected item ${item.properties.name}: ${item.properties.type}`,
            //   item
            // );
            let consume: boolean = false;
            if (item.properties.type === "key") {
              keys++;
              consume = true;
            }
            if (item.properties.type === "treasure") {
              score += item.properties.value;
              consume = true;
            }
            if (item.properties.type === "food") {
              health += item.properties.value;
              consume = true;
            }

            if (consume) {
              mapLayerItems.removeTileAt(item.x, item.y);
              //console.log(keys, score, health);
            }
          }
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
        sword.setFrame(4);
        this.time.delayedCall(
          120,
          (swordHit: Phaser.Physics.Arcade.Sprite) => {
            swordHit.destroy();
          },
          [sword],
          this
        );
        if (ghost.anims.currentAnim.key != "skeletonDie") {
          ghost.setVelocity(0, 0);
          ghost.setAcceleration(0, 0);
          ghostsGroup.remove(ghost);
          deadGhostsGroup.add(ghost);
          ghost.play("skeletonDie", true, 0);
          this.time.delayedCall(
            1000,
            ghostDead => {
              ghostDead.destroy();
            },
            [ghost],
            this
          );
          this.add.tween({
            targets: [ghost],
            ease: "Sine.easInOut",
            duration: 500,
            delay: 500,
            alpha: {
              getStart: () => 1,
              getEnd: () => 0
            }
          });
          score += 10;
        }
      }
    );

    this.physics.add.collider(knightSprite, deadGhostsGroup);
    this.physics.add.collider(ghostsGroup, deadGhostsGroup);

    this.physics.add.collider(ghostsGroup, mapLayerDoors);
    this.physics.add.collider(
      knightSprite,
      ghostsGroup,
      (o1: Phaser.Physics.Arcade.Sprite, o2: Phaser.Physics.Arcade.Sprite) => {
        if (knightSpritetakingDamage === false) {
          knightSpritetakingDamage = true;
          health--;
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
          // console.log("Ghost and player collided");
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
    this.cameras.main.startFollow(knightSprite, true, 0.8, 0.8, 0.5, 0.5);
  }

  update() {
    let pointer = this.input.activePointer;
    let moveLeft = false;
    let moveRight = false;
    let moveUp = false;
    let moveDown = false;
    let fireDirection = 0;
    let moving = false;
    let padA = false;

    statusText.setText(
      `Keys : \x01  x ${keys} - Score : ${score} : Health : \x02  ${health}`
    );
    statusText.setTint(0xff0000, 0xff0000, 0xffff00, 0xffff00);

    if (fireKey.isUp) {
      firePressed = false;
    }

    if (this.input.gamepad.total != 0) {
      let pad = this.input.gamepad.getPad(0);
      let lx = pad.leftStick.x;
      let ly = pad.leftStick.y;

      if (lx < -0.5) moveLeft = true;
      if (lx > 0.5) moveRight = true;
      if (ly < -0.5) moveUp = true;
      if (ly > 0.5) moveDown = true;

      if (!pad.A) padAPressed = false;

      if (!padAPressed) {
        if (pad.A) {
          padA = true;
          padAPressed = true;
        } else {
          padA = false;
        }
      }
    }

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

    knightSprite.setDepth(100 + getDepthFromXY(knightSprite.x, knightSprite.y));

    if (cursorKeys.right.isDown || moveRight) {
      if (fireKey.isUp) {
        knightSprite.setVelocityX(spriteVelocity);
        if (knightSprite.anims.currentAnim.key != "knightWalkEast" && !moving) {
          knightSprite.anims.play("knightWalkEast");
        }
        knightSpriteDirection = "East";
        moving = true;
      }
      if ((fireKey.isDown || padA) && !firePressed) {
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
      if ((fireKey.isDown || padA) && !firePressed) {
        knightSprite.setVelocityX(0);
        fireDirection |= 4;
      }
    } else {
      knightSprite.setVelocityX(0);
      moving = false;
    }

    if (cursorKeys.up.isDown || moveUp) {
      knightSprite.setVelocityY(-spriteVelocity);
      if ((fireKey.isDown || padA) && !firePressed) {
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
      if ((fireKey.isDown || padA) && !firePressed) {
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

      let newSword = this.physics.add
        .sprite(
          knightSprite.x,
          knightSprite.y + 8 * spriteScale,
          "swordSprite",
          fireFrame
        )
        .setDepth(101 + getDepthFromXY(knightSprite.x, knightSprite.y))
        .setSize(10, 10)
        .setOffset(5, 5);
      fireGroup.add(newSword, false);

      newSword
        .setDepth(101 + getDepthFromXY(knightSprite.x, knightSprite.y))
        .setScale(spriteScale, spriteScale)
        .setVelocityX(vx)
        .setVelocityY(vy)
        .setCollideWorldBounds(true);

      swords.push(newSword);
      firePressed = true;
    }

    let ghostXDiff, ghostYDiff;

    for (let i = 0; i < MAX_GHOSTS; i++) {
      //console.log(ghostSprites[i]);
      if (
        ghostSprites[i].active &&
        ghostSprites[i].anims.currentAnim.key != "skeletonDie"
      ) {
        ghostSprites[i].setDepth(
          100 + getDepthFromXY(ghostSprites[i].x, ghostSprites[i].y)
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
    swords.forEach((sword: Phaser.Physics.Arcade.Sprite) => {
      if (sword.visible === true) {
        // console.log(sword);
        sword.setDepth(100 + getDepthFromXY(sword.x, sword.y));
      }
    });
  }
}
