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
    Players._maxPlayers = maxPlayers;
    Players._playerIndex = 0;
    Players._players = new Array(maxPlayers - 1);
  }

  public static get Players(): Player[] {
    return Players._players;
  }

  public static CreatePlayer(): Player {
    let player: Player;

    if (Players._playerIndex < Players._maxPlayers) {
      player = new Player(Players._playerIndex);
      Players._players[Players._playerIndex++] = player;
    } else {
      player = null;
    }

    return player;
  }
}

export class Player {
  private _playerNo: number;

  constructor(playerNo: number) {
    console.log(`Player::Constructor(${playerNo})`);

    this._playerNo = playerNo;
  }
}
