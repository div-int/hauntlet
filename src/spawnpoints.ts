export abstract class SpawnPoints {
  private static _spawnpoints: SpawnPoint[] = new Array<SpawnPoint>(0);

  private constructor() {}

  public static get SpawnPoints() {
    return SpawnPoints._spawnpoints;
  }

  public static Add(spawnpoint: SpawnPoint): number {
    return spawnpoint
      ? SpawnPoints._spawnpoints.push(spawnpoint)
      : SpawnPoints._spawnpoints.length;
  }

  public static Remove(spawnpoint: SpawnPoint): number {
      return 0;
  }
}

export class SpawnPoint {
  private _name: string;
  private _x: number;
  private _y: number;

  constructor(name: string, x: number, y: number) {
    this.Name = name;
    this.XY = { x, y };
  }

  public get Name() {
    return this._name;
  }

  public set Name(name: string) {
    this._name = name ? name : "Default Spawn Point";
  }

  public get X(): number {
    return this._x;
  }

  public set X(x: number) {
    this._x = x ? x : 0;
  }

  public get Y(): number {
    return this._y;
  }

  public set Y(y: number) {
    this._y = y ? y : 0;
  }

  public get XY(): { x: number; y: number } {
    return { x: this._x, y: this._y };
  }

  public set XY({ x, y }) {
    this.X = x;
    this.Y = y;
  }
}
