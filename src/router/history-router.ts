import express from 'express';
import { read } from '../utilities/db-connection';
import { Server, Socket } from 'socket.io';

export const apiRouter = express.Router();

apiRouter.get("/bet-history", async (req: any, res: any) => {
    try {
        let { user_id, operator_id, limit } = req.query;
        if (!user_id || !operator_id) throw new Error("user_id and operator_id are required")
        if (limit) limit = Number(limit);
        const history = await getHistory({ user_id, operator_id, limit });
        return res.status(200).send({ statusCode: 200, history, message: "bets history fetched successfully" })
    } catch (error: any) {
        console.error("error occured", error.message);
        return res.status(500).send({ statusCode: 500, error: error.message, message: "unable to fetch bets history" })
    }
});

export const getHistory = async ({ user_id, operator_id, limit = 10 }: { user_id: string, operator_id: string, limit?: number }) => {
    try {
        const safeLimit = Number.isInteger(limit) && limit > 0 ? limit : 10;

        const rows = await read(`
            SELECT 
              userBets,
              lobby_id,
              result
            FROM 
                settlement
            WHERE 
                user_id = ? AND operator_id = ?
            ORDER BY created_at DESC
            LIMIT ${safeLimit}
        `, [user_id, operator_id]);

        const result: any[] = [];

        for (const row of rows) {
            try {
                const userBets = JSON.parse(row.userBets || "[]");

                const gameResult = JSON.parse(row.result || "{}");
                const winner = gameResult.winner;
                const winnerCard = gameResult.card || '';


                for (const bet of userBets) {
                    const stake = parseFloat(bet.betAmount);
                    const win = parseFloat(bet.winAmount) - stake;
                    const odds = parseFloat(bet.mult).toFixed(2);


                    result.push({
                        stake,
                        odds,
                        'p/l': bet.status === 'win' ? (bet.winAmount - bet.betAmount).toFixed(2) : 0 - stake,
                        beton: bet.chip === 1 ? 'Amar' : bet.chip === 2 ? 'Akbar' : 'Anthony',
                        round_id: row.lobby_id,
                        winningCard: winnerCard,
                    });
                }
            } catch (e) {
                console.warn('Failed to parse userBets:', e);
            }
        }

        return result;

    } catch (err) {
        console.error(`Err while getting data from table is:::`, err);
        return { err };
    }
};


export const getMatchHistory = async (socket: Socket, userId: string, operator_id: string) => {
    try {
        const historyData = await read(`SELECT lobby_id, result, created_at FROM lobbies ORDER BY created_at DESC LIMIT 3`);
        const getLastWin = await read(`SELECT win_amount FROM settlement WHERE user_id = ? and operator_id = ? and win_amount > 0 ORDER BY created_at DESC LIMIT 1`, [decodeURIComponent(userId), operator_id]);
        if (getLastWin && getLastWin.length > 0) socket.emit('lastWin', { myWinningAmount: getLastWin[0].win_amount });
        return socket.emit('historyData', historyData);
    } catch (err) {
        console.error(`Err while getting user history data is:::`, err);
        return;
    }
}

apiRouter.get('/bet/detail', async (req: any, res: any) => {
    try {
        const { operator_id, user_id, lobby_id } = req.query;

        const SQL_ROUND_HISTORY = `SELECT * FROM settlement WHERE user_id = ? and operator_id = ? and lobby_id = ?`;
        const [userBet] = await read(SQL_ROUND_HISTORY, [user_id, operator_id, lobby_id]);

        if (!userBet) {
            return res.status(404).json({ status: false, message: 'No bet data found for the given parameters' });
        }

        const roundResult = JSON.parse(userBet.result);
        const userBets = JSON.parse(userBet.userBets);

        const rankMap: Record<string, string> = {
            A: 'Ace', K: 'King', Q: 'Queen', J: 'Jack',
            '10': '10', '9': '9', '8': '8', '7': '7', '6': '6',
            '5': '5', '4': '4', '3': '3', '2': '2'
        };
        const suitMap: Record<string, string> = {
            S: 'Spades ♠', H: 'Hearts ♥', D: 'Diamonds ♦', C: 'Clubs ♣'
        };
        const [rankCode = '', suitCode = ''] = roundResult?.card?.split('-') || [];
        const resultCardFullName = `${rankMap[rankCode] || rankCode} of ${suitMap[suitCode] || suitCode}`;

        const finalData: any = {
            lobby_id: userBet.lobby_id,
            user_id: userBet.user_id,
            operator_id: userBet.operator_id,
            total_bet_amount: parseFloat(userBet.bet_amount).toFixed(2),
            result_card: resultCardFullName,
            bet_time: userBet.created_at,

        };

        // Determine winner
        let winner = '';
        if (roundResult.winner === 1) {
            winner = 'Amar';
        } else if (roundResult.winner === 2) {
            winner = 'Akbar';
        } else if (roundResult.winner === 3) {
            winner = 'Anthony';
        }
        finalData['winner'] = winner;

        // Bet mapping with chip conversion
        userBets.forEach((e: any, i: number) => {
            let mappedChip = '';
            if (e.chip == 1) mappedChip = 'Amar';
            else if (e.chip == 2) mappedChip = 'Akbar';
            else if (e.chip == 3) mappedChip = 'Anthony';


            finalData[`Bet${i + 1}`] = {
                chip: mappedChip,
                bet_amount: e.betAmount,
                win_amount: e.winAmount,
                multiplier: e.status === 'win' ? e.mult : 0,
                status: e.status
            };
        });

        return res.status(200).json({ status: true, data: finalData });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

