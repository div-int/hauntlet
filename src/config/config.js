import Phaser from "phaser";

const config = {
    type: Phaser.AUTO,
    parent: "hauntlet",
    width: 640,
    height: 512,
    pixelArt: true,
    roundPixels: false,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: {
      preload: preload,
      create: create
    }
  };
  