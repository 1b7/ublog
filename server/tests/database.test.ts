import { getDBClient } from '../database';
import { initialisePosts } from '../models/PostSchema';
import { initialiseUsers } from '../models/UserSchema';

import bcrypt from 'bcrypt';
import supertest from 'supertest';
import { expect } from 'chai';

import { app } from '../index';
const api = supertest(app);

const getAllUsers = async () => {
  const users = getDBClient().db().collection('users');
  return await users.find({}).toArray();
};

beforeEach(async () => {
  const dbClient = getDBClient();
  try {
    await dbClient.db().dropCollection('users');
    await dbClient.db().dropCollection('posts');
  } catch (e: unknown) {
    if (e instanceof Error && e.message !== 'ns not found') { 
      console.error('Error occurred in test setup: could not drop at least one collection'); 
    }
  }

  await initialiseUsers(dbClient.db());
  await initialisePosts(dbClient.db());
  
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
  
  await Promise.all(
    initialUsers.map(({ username, password }) => createUser(username, password))
  );
});

after(async () => {
  await getDBClient().close();
});

describe('User Creation', () => {
  const createUserQuery = (username: string, password: string) => ({
    query: `#graphql
      mutation CreateUser {
        createUser(username: "${username}", password: "${password}") {
          ...on User { username, created }
          ...on Error { error }
        }
      }`
  });

  it('Can create a new user', async () => {
    const initialState = await getAllUsers();
    expect(initialState).lengthOf(2);

    await api.post('/graphql')
      .send(createUserQuery('user2', 'password'))
      .expect(200);

    const finalState = (await getAllUsers()).map(u => u.username);
    expect(finalState).lengthOf(3);
    expect(finalState).contains('user2');
  });

  it('Cannot create a user which already exists', async () => {
    const initialState = await getAllUsers();
    expect(initialState).lengthOf(2);

    const result = await api.post('/graphql')
      .send(createUserQuery('user1', 'password'))
      .expect(200);

    expect(result.body.data.createUser).deep.equals({ error: 'User already exists' });
    const finalState = await getAllUsers();
    expect(finalState).lengthOf(2);
  });

  it('Cannot create a user with too short of a username', async () => {
    const initialState = await getAllUsers();
    expect(initialState).lengthOf(2);

    const result = await api.post('/graphql')
      .send(createUserQuery('aa', 'password'))
      .expect(200);

    expect(result.body.data.createUser).deep.equals({ error: 'Validation error' });
    const finalState = await getAllUsers();
    expect(finalState).lengthOf(2);
  });
  
  it('Cannot create a user with too long of a username', async () => {
    const initialState = await getAllUsers();
    expect(initialState).lengthOf(2);

    const result = await api.post('/graphql')
      .send(createUserQuery('An_Absurdly_Long_Username_', 'password'))
      .expect(200);

    expect(result.body.data.createUser).deep.equals({ error: 'Validation error' });
    const finalState = await getAllUsers();
    expect(finalState).lengthOf(2);
  });

  it('Cannot create a username containing illegal characters', async () => {
    const initialState = await getAllUsers();
    expect(initialState).lengthOf(2);

    const result = await api.post('/graphql')
      .send(createUserQuery('illegal!-username', 'password'))
      .expect(200);
    
    expect(result.body.data.createUser).deep.equals({ error: 'Validation error' });
    const finalState = await getAllUsers();
    expect(finalState).lengthOf(2);
  });
});

const createLoginQuery = (username: string, password: string) => ({
  query: `#graphql
      mutation Login { 
        login(username: "${username}", password: "${password}") {
          ...on Token { token }
          ...on Error { error }
        }
      }`
});

describe('Login Process', () => {
  it('Legitimate users can sign in', async () => {
    const result = await api.post('/graphql')
      .send(createLoginQuery('user0', 'abcdefghij'))
      .expect(200);
    expect(result.body.data.login).to.exist;
  });

  it('Incorrect credentials are rejected', async () => {
    const result = await api.post('/graphql')
      .send(createLoginQuery('user0', 'NotTheRightPassword!'))
      .expect(200);
    expect(result.body.data.login).deep.equals({ error: 'Incorrect username or password' });
  });
});

const createPostQuery = (title: string, content: string) => ({
  query: `#graphql
    mutation AddBlog {
    createPost(title: "${title}", content: "${content}") {
      ...on Post { title, content },
      ...on Error { error }
    }
  }`
});

describe('Posts', () => {
  let authorization: string;
  const credentials = { username: 'user0', password: 'abcdefghij' };

  before(async () => {
    const result = await api.post('/graphql')
      .send(createLoginQuery(credentials.username, credentials.password))
      .expect(200);
    authorization = `bearer ${result.body.data.login.token}`;
  });

  it('Can be created', async () => {
    const result = await api.post('/graphql')
      .set('authorization', authorization)
      .send(createPostQuery('Some blog post', 'Some Text'))
      .expect(200);
    
    const finalState = getAllUsers();
    const user = (await finalState).find(u => u.username === credentials.username);
    const newPostId = user!.posts[0];
    const newPost = await getDBClient().db().collection('posts').findOne({_id: newPostId});

    const expectedPost = { title: 'Some blog post', content: 'Some Text' };
    expect(result.body.data.createPost).includes(expectedPost);
    expect(newPost).includes(expectedPost);
  });
});

describe('Following', () => {
  let authorization: string;
  const credentials = { username: 'user0', password: 'abcdefghij' };

  before(async () => {
    const result = await api.post('/graphql')
      .send(createLoginQuery(credentials.username, credentials.password))
      .expect(200);
    authorization = `bearer ${result.body.data.login.token}`;
  });

  const addFollowQuery = (user: string) => ({
    query: `#graphql
      mutation AddFollowing {
        follow(username: "${user}") {
          ...on Message { message }
          ...on Error { error }
        }
      } `
  });

  const removeFollowQuery = (user: string) => ({
    query: `#graphql
      mutation RemoveFollowing {
        unfollow(username: "${user}") {
          ...on Message { message }
          ...on Error { error }
        }
      } `
  });

  it('Can be added', async () => {
    const result = await api.post('/graphql')
      .set('authorization', authorization)
      .send(addFollowQuery('user1'))
      .expect(200);

    expect(result.body).to.deep.equal({ data: { follow: { message: 'Successfully followed user' }}});
    
    const finalState = await getAllUsers();
    const user = finalState.find(u => u.username === credentials.username)!;
    expect(user.following).deep.equals(['user1']);
  });

  it('One user cannot be followed twice at once', async () => {
    await api.post('/graphql')
      .set('authorization', authorization)
      .send(addFollowQuery('user1'))
      .expect(200);
    
    const result = await api.post('/graphql')
      .set('authorization', authorization)
      .send(addFollowQuery('user1'))
      .expect(200);

    expect(result.body).to.deep.equal({ data: { follow: { message: 'Successfully followed user' }}});
    
    const finalState = await getAllUsers();
    const user = finalState.find(u => u.username === credentials.username)!;
    expect(user.following).deep.equals(['user1']);
  });

  it('Cannot follow non-existent users', async () => {
    await api.post('/graphql')
      .set('authorization', authorization)
      .send(addFollowQuery('doesnotexist'))
      .expect(200);

    
    const finalState = await getAllUsers();
    const user = finalState.find(u => u.username === credentials.username)!;
    expect(user.following).deep.equals([]);
  });

  it('Users can be unfollowed', async() => {
    await api.post('/graphql')
      .set('authorization', authorization)
      .send(addFollowQuery('user1'))
      .expect(200);

    const intermediateState = await getAllUsers();
    let user = intermediateState.find(u => u.username === credentials.username)!;
    expect(user.following).deep.equals(['user1']);
    
    const result = await api.post('/graphql')
      .set('authorization', authorization)
      .send(removeFollowQuery('user1'))
      .expect(200);
      
    expect(result.body).to.deep.equal({ data: { unfollow: { message: 'Successfully unfollowed user' }}});
    const finalState = await getAllUsers();
    user = finalState.find(u => u.username === credentials.username)!;
    expect(user.following).deep.equals([]);
  });

  it('Non-followed users can be unfollowed without error', async() => {
    const result = await api.post('/graphql')
      .set('authorization', authorization)
      .send(removeFollowQuery('user1'))
      .expect(200);
      
    expect(result.body).to.deep.equal({ data: { unfollow: { message: 'Successfully unfollowed user' }}});
    const finalState = await getAllUsers();
    const user = finalState.find(u => u.username === credentials.username)!;
    expect(user.following).deep.equals([]);
  });

  it('Cannot unfollow non-existent users', async() => {
    const result = await api.post('/graphql')
      .set('authorization', authorization)
      .send(removeFollowQuery('doesnotexist'))
      .expect(200);
      

    expect(result.body.data.unfollow).deep.equals({error: 'No such user exists'});
    const finalState = await getAllUsers();
    const user = finalState.find(u => u.username === credentials.username)!;
    expect(user.following).deep.equals([]);
  });

  it('Can see posts from followed users', async () => {
    const otherCredentials = { username: 'user1', password: 'jihgfedcba' };
    let result = await api.post('/graphql')
      .send(createLoginQuery(otherCredentials.username, otherCredentials.password))
      .expect(200);
    const otherAuth = `bearer ${result.body.data.login.token}`;

    // Using user1 account, create Post to be viewed later. 
    await api.post('/graphql')
      .set('authorization', otherAuth)
      .send(createPostQuery('Some blog post', 'Some Text'))
      .expect(200);

    await api.post('/graphql')
      .set('authorization', otherAuth)
      .send(createPostQuery('Some other post', 'Some Other Text'))
      .expect(200);

    // Set user0 to follow user1.
    await api.post('/graphql')
      .set('authorization', authorization)
      .send(addFollowQuery('user1'))
      .expect(200);

    // Test if user0 now receives posts from user1.
    result = await api.post('/graphql')
      .set('authorization', authorization)
      .send({
        query: `#graphql
          query Feed {
            loggedIn {
              ...on User {
              following {
                username
                posts { title }
              }
              }
            }
          } `
      })
      .expect(200);
    
    expect(result.body.data.loggedIn).deep.equals({
      following: [
        { 
          username: 'user1', 
          posts: [ 
            { title: 'Some blog post' },
            { title: 'Some other post' },
          ] 
        }
      ]
    });
  });
});