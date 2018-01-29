const { PubSub, withFilter } = require('graphql-subscriptions');
const async = require('asyncawait/async');
const asyncawait = require('asyncawait/await');
const datastore = require('nedb-promise');

const db = datastore({
    filename: './messages.db',
    autoload: true
});
db.ensureIndex({ fieldName: 'ct' });

let status = {
    occupied: false,
    userid: '',
    expires: ''
};

let interval;
const pubsub = new PubSub();
module.exports = {
    Query: {
        messages: async (() => {
            return asyncawait (
                db.cfind({})
                    .sort({ ct: -1 })
                    .limit(50)
                    .exec()
            );
        }),
        status: () => {
            return status;
        }
    },
    Mutation: {
        addMessage: async((root, args) => {
            if (args.userid !== status.userid) {
                return {
                    _id: 'error',
                    text: 'An error occurred, please refresh the page',
                    signature: ''
                };
            }

            const message = {
                text: args.text,
                signature: args.signature || '',
                ct: Date.now()
            };

            return asyncawait (db.insert(message));
        }),
        enterRoom: (root, args) => {
            if (status.occupied) { // bail if already occupied
                return status;
            }

            const expiry = Date.now() + (60 * 1000);
            status = {
                occupied: true,
                userid: args.userid,
                expires: '' + expiry
            };

            interval = setInterval(() => {
                if (Date.now() >= expiry) {
                    clearInterval(interval);
                    status = {
                        occupied: false,
                        userid: '',
                        expires: ''
                    };
                    pubsub.publish('statusChanged', {statusChanged: status});
                }
            }, 1000);

            pubsub.publish('statusChanged', {statusChanged: status});
            return status;
        },
        leaveRoom: (root, args) => {
            if (!status.occupied || status.userid !== args.userid) {
                return status;
            }

            clearInterval(interval);
            status = {
                occupied: false,
                userid: '',
                expires: ''
            };
            pubsub.publish('statusChanged', {statusChanged: status});
            return status;
        }
    },
    Subscription: {
        statusChanged: {
            subscribe: () => pubsub.asyncIterator(['statusChanged'])
        }
    }
};
