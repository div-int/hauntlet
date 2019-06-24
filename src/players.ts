export interface PlayerIsDeadCallback { (player: Player) : boolean};

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

  public static CreatePlayer(name?: string, startHealth?: number, playerIsDeadCallback?: PlayerIsDeadCallback): Player {
    let player: Player;

    if (Players._playerIndex < Players._maxPlayers) {
      player = new Player(Players._playerIndex, name, startHealth, playerIsDeadCallback);
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

  private _isDead: boolean;
  private _playerIsDeadCallback: PlayerIsDeadCallback;

  public constructor(no: number, name: string, startHealth?: number, playerIsDeadCallback?: PlayerIsDeadCallback) {
    this._no = no ? no : 0;
    //this._name = name ? name : "Player";
    this.Name = name;
    //this._score = 0;
    this.Score = 0;
    //this._health = startHealth ? ((startHealth > 0) ? startHealth : 0) : 0;
    this.Health = startHealth;
    this._playerIsDeadCallback = playerIsDeadCallback ? playerIsDeadCallback : null;
  }

  public get No() {
    return this._no;
  }

  public get Name() {
    return this._name;
  }

  public set Name(name: string) {
    this._name = name ? name : 'Default Player'
  }

  public get Score() {
    return this._score;
  }

  public set Score(score: number) {
    this._score = score >= 0 ? score : 0;
  }

  public get Health() {
    return this._health;
  }

  public set Health(health: number) {
    this._health = health ? ((health > 0) ? health : 0) : 0;

    if (this._health > 0) {
      this._isDead = false;
    } else {
      this._isDead = true;
      if (this._playerIsDeadCallback) {
        console.log(`Calling player is dead callback : ${this._playerIsDeadCallback(this)}`);
      }
    }
  }
}
