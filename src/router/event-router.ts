import { Server } from 'socket.io';
import { initRounds } from '../module/lobbies/lobby-event';

export const eventRouter = async (io: Server): Promise<void> => {
  initRounds(io);
};