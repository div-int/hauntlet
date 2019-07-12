export default {
  type: Phaser.AUTO,
  parent: "hauntlet",
  width: window.innerWidth,
  height: window.innerHeight,
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  input: {
    gamepad: true
  },
  physics: {
    default: "arcade",
    arcade: {
      debug: false,
      gravity: { x: 0, y: 0 }
    }
  }
};
