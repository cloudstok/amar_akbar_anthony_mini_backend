import { Router, Request, Response } from 'express';

const routes = Router();

routes.get('/', async (req: Request, res: Response) => {
  res.send({ status: true, msg: 'Amar Akbar Anthony Game Testing Successfully 👍' });
});

export { routes };
