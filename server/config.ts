import { config } from 'dotenv';
import path from 'path';

export const initialiseEnv = () => {
  console.log('Initialising environment with mode:', process.env.NODE_ENV);

  const envPath = process.env.NODE_ENV === 'TEST'
    ? '.env.test'
    : '.env';
  config({ path: path.resolve(process.cwd(), envPath) });

  const envVars =  [
    { label: 'JWT_SECRET',  description: 'A string used to sign web tokens'    },
    { label: 'MONGODB_URI', description: 'A URI string for a MongoDB database' },
    { label: 'PORT',        description: 'The port the API will run on'        },
  ];

  envVars.forEach(v => {
    if (!process.env[v.label]) {
      console.error(`ENV error: ${v.label} is not set; please do so. (${v.description}).`);
      process.exit(4);
    }
  });
};