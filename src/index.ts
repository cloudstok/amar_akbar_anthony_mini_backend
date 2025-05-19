import express from 'express';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import http from 'http';
import { initSocket } from './socket';
import { routes } from './router/routes';
import dotenv from 'dotenv';
import { createLogger } from './utilities/logger';
import { checkDatabaseConnection, createTables } from './utilities/db-connection';
import { initializeRedis } from './utilities/redis-connection';
import { connect } from './utilities/amqp';
import { apiRouter } from './router/history-router';

dotenv.config();
const port = process.env.PORT || 4200;
const logger = createLogger('Server');

const startServer = async () => {
    await Promise.all([checkDatabaseConnection(), initializeRedis(), connect(), createTables()]);

    const app = express();
    const server = http.createServer(app);
    const io = new SocketIOServer(server);

    app.use(cors());
    app.use(express.json());
    initSocket(io);
    app.use(routes);
    app.use(apiRouter);


    server.listen(port, () => {
        logger.info(`Server listening at PORT ${port}`);
    });
};

startServer();
