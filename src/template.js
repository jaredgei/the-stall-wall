import React from 'react';
import ReactDOM from 'react-dom';
import shortid from 'shortid';
import Cookies from 'js-cookie';
import { ApolloClient } from 'apollo-client';
import { getMainDefinition } from 'apollo-utilities';
import { split } from 'apollo-link';
import { createHttpLink } from 'apollo-link-http';
import { WebSocketLink } from 'apollo-link-ws';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { ApolloProvider } from 'react-apollo';
import App from './components/App';
import './css/common.scss';

const httpLink = createHttpLink({
    uri: '/graphql'
});
const wsLink = new WebSocketLink({
    uri: 'ws://' + window.location.host + '/subscriptions',
    options: {
        reconnect: true
    }
});
const link = split(
    ({ query }) => {
        const { kind, operation } = getMainDefinition(query);
        return kind === 'OperationDefinition' && operation === 'subscription';
    },
    wsLink,
    httpLink,
);
const client = new ApolloClient({
    link: link,
    cache: new InMemoryCache()
});

if (!Cookies.get('userid')) {
    Cookies.set('userid', shortid.generate()); // create a unique identifier for this user
}

ReactDOM.render(<ApolloProvider client={client}><App /></ApolloProvider>, document.getElementById('react-root'));
