import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import { getDBClient } from '../database';
  
export const createUser = async (username: string, plaintext: string) => {
  const passwordHash = await bcrypt.hash(plaintext, 10);
  const newUser = { username, passwordHash, created: new Date(), posts: [], following: [] };
  const users = getDBClient().db().collection('users');
  await users.insertOne(newUser);
};

export const getUser = (username: string) => 
  getDBClient().db().collection('users').findOne({ username });
  
export const loginUser = async (username: string, plaintext: string) => {
  if (!process.env.JWT_SECRET) {
    console.error('env.JWT_SECRET MUST be defined for this application to function.');
    process.exit(3); 
  }
  
  const users = getDBClient().db().collection('users');
  const user = await users.findOne({ username });
  
  if (user) {
    if (!user.passwordHash) {
      console.error(`Login for user: '${user.username}' attempted, but has no passwordHash.`);
      return { error: 'Something went wrong!' };
    }
  
    const hashesMatch = await bcrypt.compare(plaintext, user.passwordHash);
    if (hashesMatch) return jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: 60 * 60 });
  } 
  
  return 'Incorrect username or password';
};