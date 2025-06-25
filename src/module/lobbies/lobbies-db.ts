import { write } from '../../utilities/db-connection';

const SQL_INSERT_LOBBIES = 'INSERT INTO lobbies (lobby_id, start_delay, end_delay, result) values(?,?,?,?)';

interface LobbyData {
  lobbyId: number;
  start_delay: number;
  end_delay: number;
  result: {};
  time?: Date;
}

export const insertLobbies = async (data: LobbyData): Promise<void> => {
  try {
    const { time, ...lobbyInfo } = data;
     if (typeof lobbyInfo.result === 'object') {
        lobbyInfo.result = JSON.stringify(lobbyInfo.result);
      }
    await write(SQL_INSERT_LOBBIES, Object.values(lobbyInfo));
  } catch (err) {
    console.error(err);
  }
};
