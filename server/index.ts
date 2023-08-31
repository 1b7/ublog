import { initialiseEnv } from './config';
initialiseEnv();

import express from 'express';
import cors from 'cors';
import { createHandler } from 'graphql-http/lib/use/express';
import playground from 'graphql-playground-middleware-express';
import jwt from 'jsonwebtoken';

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

const tokenExtractor = (authString: string | null) => {
  if (!authString) { return null; }
  const token = authString.replace('bearer ', '');
  const decoded = jwt.verify(token, process.env.JWT_SECRET!);
  return decoded;
};

app.use('/', indexRouter);

app.all('/graphql', createHandler({
  schema, 
  // https://github.com/graphql/graphql-http/discussions/99#discussioncomment-6381926
  context: (req) => ({
    auth: typeof req.headers.get === 'function'
      ? tokenExtractor(req.headers.get('authorization'))
      : tokenExtractor(Object(req.headers).authorization)
  })
}));

app.get('/playground', playground({ endpoint: '/graphql' }));

const port = process.env.PORT;
app.listen(port, () => {
  console.log(`API running on port ${port}.`);
});