import { config } from 'dotenv';
import path from 'path';

export const initialiseEnv = () => {
  console.log('Initialising environment with mode:', process.env.NODE_ENV);

  const envPath = process.env.NODE_ENV === 'TEST'
    ? '.env.test'
    : '.env';
  config({ path: path.resolve(process.cwd(), envPath) });

  if (!process.env.JWT_SECRET) {
    console.error('ENV error: JWT_SECRET is not set; please do so. (A string used to sign web tokens).');
    process.exit(4);
  }

  if (!process.env.MONGODB_URI) {
    console.error('ENV error: MONGODB_URI is not set; please do so. (A URI string for a MongoDB database).');
    process.exit(5);
  }
    
  if (!process.env.PORT) {
    console.error('ENV error: PORT is not set; please do so. (The port the API will run on).');
    process.exit(6);
  }
};