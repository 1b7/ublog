import { Router } from 'express';

const indexRouter = Router();

indexRouter.get('/', (req, res) => {
  res.send('<h1>Hello World!</h1>');
});

export default indexRouter;