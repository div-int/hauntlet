export default {
  type: Phaser.AUTO,
  parent: "hauntlet",
  width: window.innerWidth,
  height: window.innerHeight,
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: "arcade",
    arcade: {
      debug: true,
      gravity: { x: 0, y: 0 }
    }
  }
};
