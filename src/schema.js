const { makeExecutableSchema } = require('graphql-tools');
const resolvers = require('./resolvers');

const typeDefs = `

type Status {
    occupied: Boolean,
    userid: String,
    expires: String
}

type Message {
    _id: ID!
    text: String,
    signature: String
}

type Query {
    status: Status,
    messages: [Message]
}

type Mutation {
    enterRoom(userid: String!): Status,
    leaveRoom(userid: String!): Status,
    addMessage(text: String!, userid: String!, signature: String): Message
}

type Subscription {
    statusChanged: Status
}

`;

module.exports = makeExecutableSchema({ typeDefs, resolvers });
