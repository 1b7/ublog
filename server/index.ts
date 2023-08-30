import { config } from 'dotenv';
config();

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

import { expressMiddleware } from '@apollo/server/express4';

import graphqlServer from './middleware/graphqlServer';
import { getDBClient } from './middleware/database';
import indexRouter from './routes/indexRouter';

export const app = express();
app.use('/', indexRouter);

getDBClient();

graphqlServer.start().then(() => {
  app.use(
    '/graphql', 
    cors(),
    bodyParser.json(),
    expressMiddleware(graphqlServer)
  );
  
  const port = process.env.PORT;
  app.listen(port, () => {
    console.log(`API running on port ${port} in '${process.env.NODE_ENV}' environment.`);
  });
});