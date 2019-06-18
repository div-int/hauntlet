export default {
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
    physics: {
      default: "arcade",
      arcade: {
          debug: true,
          gravity: {x:0, y: 0}
      }
    }
};
  