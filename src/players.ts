export abstract class Players {
  private static _maxPlayers: number = 0;
  private static _playerIndex: number = 0;
  private static _players: Player[] = null;

  private constructor() {
    console.log(`Players::Constructor()`);
  }

  public static get MaxPlayers(): number {
    return Players._maxPlayers;
  }

  public static set MaxPlayers(maxPlayers: number) {
    Players._maxPlayers = maxPlayers ? maxPlayers : 1;
    Players._playerIndex = 0;
    Players._players = new Array(Players._maxPlayers - 1);
  }

  public static get Players(): Player[] {
    return Players._players.slice(0, Players._playerIndex);
  }

  public static CreatePlayer(name?: string, startHealth?: number): Player {
    let player: Player;

    if (Players._playerIndex < Players._maxPlayers) {
      player = new Player(Players._playerIndex, name, startHealth);
      Players._players[Players._playerIndex++] = player;
    } else {
      player = null;
    }

    return player;
  }
}

export class Player {
  private _no: number;
  private _name: string;

  private _score: number;
  private _health: number;

  public constructor(no: number, name: string, startHealth?: number) {
    this._no = no ? no : 0;
    this._name = name ? name : "Player";
    this._score = 0;
    this._health = startHealth ? ((startHealth > 0) ? startHealth : 0) : 0;
  }

  public get PlayerNo() {
    return this._no;
  }

  public get PlayerName() {
    return this._name;
  }

  public get Score() {
    return this._score;
  }

  public set Score(score: number) {
    this._score = score;
  }

  public get Health() {
    return this._health;
  }

  public set Health(health: number) {
    this._health = health;
  }
}
