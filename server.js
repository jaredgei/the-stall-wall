const bodyParser = require('body-parser');
const express = require('express');
const { execute, subscribe } = require('graphql');
const { createServer } = require('http');
const { graphqlExpress, graphiqlExpress } = require('graphql-server-express');
const schema = require('./src/schema');
const { SubscriptionServer } = require('subscriptions-transport-ws');

const isProduction = process.env.NODE_ENV === 'production';
const app = express();
const port = process.env.PORT || 3000;

app.use(express.static('./'));
app.use(express.static('dist'));
app.use('/graphql', bodyParser.json(), graphqlExpress({
    schema
}));

if (!isProduction) {
    const webpack = require('webpack');
    const webpackDevMiddleware = require('webpack-dev-middleware');
    const webpackHotMiddleware = require('webpack-hot-middleware');
    const webpackConfig = require('./webpack.config');

    app.use('/graphiql', graphiqlExpress({
        endpointURL: '/graphql',
        subscriptionsEndpoint: 'ws://localhost:' + port + '/subscriptions'
    }));

    const compiler = webpack(webpackConfig);
    app.use(webpackDevMiddleware(compiler, {
        stats: {colors: true}
    }));
    app.use(webpackHotMiddleware(compiler, {
        log: console.log
    }));
}

app.get('*', (req, res, next) => {
    res.sendFile(`${__dirname}/dist/index.html`);
});

const ws = createServer(app);
ws.listen(port, () => {
    console.log('server listening on', port);

    new SubscriptionServer({
        execute,
        subscribe,
        schema
    }, {
        server: ws,
        path: '/subscriptions'
    });
});
