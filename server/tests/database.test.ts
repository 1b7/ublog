import { getDBClient, initialiseUsers } from '../middleware/database';
import bcrypt from 'bcrypt';
import { app } from '../index';
import supertest from 'supertest';
import { expect } from 'chai';

const api = supertest(app);

const dbClient = getDBClient();

const getAllUsers = async () => {
  const users = dbClient.db().collection('users');
  const result = users.find({});

  const output = [];
  for await (const user of result) { output.push(user); }

  return output;
};

beforeEach(async () => {
  try {
    await dbClient.db().dropCollection('users');
  } catch (e: unknown) {
    if (e instanceof Error && e.message !== 'ns not found') { 
      console.error('Error occurred in test setup: could not drop `users` collection'); 
    }
  }

  await initialiseUsers(dbClient.db());
  
  const createUser = async (username: string, plaintext: string) => {
    const passwordHash = await bcrypt.hash(plaintext, 10);
    const newUser = { username, passwordHash, created: new Date(), posts: [], following: [] };
    const users = getDBClient().db().collection('users');
    await users.insertOne(newUser);
  };
  
  const initialUsers = [
    { username: 'user0', password: 'abcdefghij' }, 
    { username: 'user1', password: 'jihgfedcba' }
  ];

  await Promise.all(initialUsers.map(u => createUser(u.username, u.password)));
});

after(async () => {
  await dbClient.close();
});

describe('User Creation', () => {
  it('Can create a new user', async () => {
    const initialState = await getAllUsers();
    expect(initialState).lengthOf(2);

    await api.post('/graphql')
      .send({
        query: `#graphql
          mutation CreateUser {
            addUser(username: "user2", password: "password") {
              username,
              created
            }
          } `
      })
      .expect(200);

    const finalState = (await getAllUsers()).map(u => u.username);
    expect(finalState).lengthOf(3);
    expect(finalState).contains('user2');
  });

  it('Cannot create a user which already exists', async () => {
    const initialState = await getAllUsers();
    expect(initialState).lengthOf(2);

    const result = await api.post('/graphql')
      .send({
        query: `#graphql
          mutation CreateUser {
            addUser(username: "user1", password: "password") {
              username,
              created
            }
          } `
      })
      .expect(200);

    expect(result.body.errors[0].message).to.match(/E11000 duplicate key error collection/);
    const finalState = await getAllUsers();
    expect(finalState).lengthOf(2);
  });
});