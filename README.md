# A Microblogging App
A simple application intended to allow users to create text posts and/or subscribe to one 
another's feeds. This is _heavily_ work in progress and intentionally simple in scope.
The initial focus will be on building the core API rather than the user interface. 

This project has been built with the following technologies:

- `typescript` as its primary language.
- `express` as the main server framework.
- `graphql` + `apollo` for a GraphQL based API.
- `mongodb` for data storage. No ODM has been used.
- `mocha`, `chai` and `supertest` for testing.
- `bcrypt` for secure password hashing, and `jsonwebtoken` for token-based authorization.

**Note**: This is an example application built solely for the author's edification.
This is not meant to be taken as an example of a well-written project adhering to best practices.

## API Feature List
Basic Functionality:

- [x] User Creation.
- [x] Login Process.
- [ ] Create a new post, with bearer-based authorization.
- [ ] Un/Follow a user.
- [ ] View all posts from followed users.

## Building this project
- Make a copy of `.example.env` and rename this to `.env`; alter the values it contains
as appropriate (i.e. add values for `MONGODB_URI`, `MONGODB_TEST_URI` and `SECRET`).
- Run `npm install`;
- Run `npm start`.