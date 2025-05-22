import { appConfig } from './app-config';
import { createLogger } from './logger';
import { Socket } from 'socket.io';
import { GameResult } from '../module/bets/bets-session';

const failedBetLogger = createLogger('failedBets', 'jsonl');

export const logEventAndEmitResponse = (
  socket: Socket,
  req: any,
  res: string,
  event: string
): void => {
  const logData = JSON.stringify({ req, res });
  if (event === 'bet') {
    failedBetLogger.error(logData);
  }
  socket.emit('betError', { message: res, status: false });
};

export const getUserIP = (socket: any): string => {
  const forwardedFor = socket.handshake.headers?.['x-forwarded-for'];
  if (forwardedFor) {
    const ip = forwardedFor.split(',')[0].trim();
    if (ip) return ip;
  }
  return socket.handshake.address || '';
};

const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const suits = ['D', 'H', 'C', 'S'];

function drawRandomCard(): string {
  const v = values[Math.floor(Math.random() * values.length)];
  const s = suits[Math.floor(Math.random() * suits.length)];
  return `${v}-${s}`;
}

export const getResult = (): GameResult => {
  const card = drawRandomCard();
  const value = card.split('-')[0];

  let winner: 1 | 2 | 3;
  if (['A', '2', '3', '4', '5', '6'].includes(value)) winner = 1;
  else if (['7', '8', '9', '10'].includes(value)) winner = 2;
  else /* J,Q,K */     winner = 3;

  return { card, winner };
};

export type BetResult = {
  chip: number;
  betAmount: number;
  winAmount: number;
  mult: number;
  status: 'win' | 'loss';
};

export const getBetResult = (betAmount: number, chip: number, result: number): BetResult => {
  const resultData: BetResult = {
    chip,
    betAmount,
    winAmount: 0,
    mult: chip === 1 ? 2.10 : chip === 2 ? 3.15 : 4.15,
    status: 'loss'
  };

  if (chip === result) {
    resultData.status = 'win';
    resultData.winAmount = Math.min(betAmount * resultData.mult, appConfig.maxCashoutAmount);
  }
  return resultData;
};
