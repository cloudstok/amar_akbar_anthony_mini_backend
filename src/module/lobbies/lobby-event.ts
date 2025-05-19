import { Server } from 'socket.io';
import { insertLobbies } from './lobbies-db';
import { createLogger } from '../../utilities/logger';
import { setCurrentLobby } from '../bets/bets-session';
import { getResult } from '../../utilities/helper-function';
import { settleBet } from '../bets/bets-session';

const logger = createLogger('lobbies', 'jsonl');

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const initRounds = async (io: Server): Promise<void> => {
  logger.info('lobby started');
  await initLobby(io);
};

const initLobby = async (io: Server): Promise<void> => {

  const lobbyId = Date.now();
  // const lobbyId = 1745327065811;
  const recurLobbyData: { lobbyId: number; status: number } = {
    lobbyId,
    status: 0,
  };

  setCurrentLobby(recurLobbyData);

  const start_delay = 15;
  const result = getResult();
  const end_delay = 3;

  for (let x = start_delay; x >= 0; x--) {
    io.emit('cards', `${lobbyId}:${x}:STARTING`);
    await sleep(1000);
  }

  recurLobbyData.status = 1;
  setCurrentLobby(recurLobbyData);

  io.emit('cards', `${lobbyId}:0:CALCULATING`);
  await sleep(3000);

  recurLobbyData.status = 2;
  setCurrentLobby(recurLobbyData);
  io.emit('cards', `${lobbyId}:${JSON.stringify(result)}:RESULT`);

  await sleep(8000);
  await settleBet(io, result, lobbyId);

  recurLobbyData.status = 3;
  setCurrentLobby(recurLobbyData);
  for (let z = 1; z <= end_delay; z++) {
    io.emit('cards', `${lobbyId}:${z}:ENDED`);
    await sleep(1000);
  }

  const history = {
    time: new Date(),
    lobbyId,
    start_delay,
    end_delay,
    result,
  };

  io.emit('history', JSON.stringify(history));
  logger.info(JSON.stringify(history));
  await insertLobbies(history);

  return initLobby(io);
};
