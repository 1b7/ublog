import { config } from 'dotenv';
config();

import express from 'express';
import cors from 'cors';
import { createHandler } from 'graphql-http/lib/use/express';
import playground from 'graphql-playground-middleware-express';

import { schema } from './schema/Schema';
import { getDBClient, initialiseDB } from './database';
import indexRouter from './routes/indexRouter';

// Initialise Database:
initialiseDB();
getDBClient();

export const app = express();
app.use(cors());

app.use((req, res, next) => { 
  console.log(req.method, req.url);
  next();
});

app.use('/', indexRouter);
app.all('/graphql', createHandler({ schema }));
app.get('/playground', playground({ endpoint: '/graphql' }));

const port = process.env.PORT;
app.listen(port, () => {
  console.log(`API running on port ${port} in '${process.env.NODE_ENV}' environment.`);
});