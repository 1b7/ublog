import { initialiseEnv } from './config';
initialiseEnv();

import express from 'express';
import cors from 'cors';
import { createHandler } from 'graphql-http/lib/use/express';
import playground from 'graphql-playground-middleware-express';
import jwt, { TokenExpiredError } from 'jsonwebtoken';

import { schema, resolver } from './schema/Schema';
import { getDBClient, initialiseDB } from './database';
import indexRouter from './routes/indexRouter';

// Initialise Database:
initialiseDB();
getDBClient();

export const app = express();
app.use(cors());

const tokenExtractor = (authString: string | null) => {
  if (!authString) { return null; }
  const token = authString.replace('bearer ', '');
  try {
    return jwt.verify(token, process.env.JWT_SECRET!);
  } catch (e) {
    if (e instanceof TokenExpiredError) {
      return null;
    } else {
      console.error('Error occurred when verifying JWT');
      console.error(e);
    }
  }
};

app.use('/', indexRouter);

app.all('/graphql', createHandler({
  schema,
  rootValue: resolver, 
  // https://github.com/graphql/graphql-http/discussions/99#discussioncomment-6381926
  context: (req) => ({
    auth: typeof req.headers.get === 'function'
      ? tokenExtractor(req.headers.get('authorization'))
      : tokenExtractor(Object(req.headers).authorization)
  })
}));

app.get('/playground', playground({ endpoint: '/graphql' }));

if (process.env.NODE_ENV !== 'TEST') {
  const port = process.env.PORT;
  app.listen(port, () => {
    console.log(`API running on port ${port}.`);
  });
}