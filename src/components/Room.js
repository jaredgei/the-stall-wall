import React, {Component} from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import {
    compose,
    graphql
} from 'react-apollo';
import Cookies from 'js-cookie';
import gql from 'graphql-tag';

import Message from './Message';
import SendMessage from './SendMessage';
import '../css/room.scss';

const query = gql`
    query dataQuery {
        status {
            occupied,
            userid,
            expires
        },
        messages {
            _id,
            text,
            signature
        }
    }
`;

const leaveRoom = gql`
    mutation leaveRoom($userid: String!) {
        leaveRoom(userid: $userid) {
            occupied,
            userid,
            expires
        }
    }
`;

const subscription = gql`
    subscription statusChanged {
        statusChanged {
            occupied,
            userid,
            expires
        }
    }
`;

class Room extends Component {
    static propTypes = {
        data: PropTypes.shape({
            loading: PropTypes.bool,
            error: PropTypes.object,
            status: PropTypes.object,
            messages: PropTypes.array,
            subscribeToMore: PropTypes.func
        }).isRequired,
        leaveRoom: PropTypes.func.isRequired,
        history: PropTypes.object
    };

    constructor() {
        super();
        this.userid = Cookies.get('userid');
        this.onUnload = this.leaveRoom.bind(this);
        this.state = {
            secondsRemaining: 60
        };
        this._interval = setInterval(this.count.bind(this), 200);
    }

    count() {
        const status = this.props.data.status;
        if (!status) {
            return;
        }

        const expiry = status.expires ? Number(status.expires) : 0;
        if (Date.now() >= expiry) {
            clearInterval(this._interval);
            this.setState({
                secondsRemaining: 0
            });
            return;
        }

        this.setState({
            secondsRemaining: Math.round((expiry - Date.now()) / 1000)
        });
    }

    componentWillMount() {
        this.props.data.refetch(); // make sure we're working with the latest and greatest
    }

    componentDidMount() {
        window.addEventListener('beforeunload', this.onUnload);
        this.props.data.subscribeToMore({
            document: subscription,
            updateQuery: (prev, { subscriptionData }) => {
                if (!subscriptionData.data) {
                    return prev;
                }

                return Object.assign({}, prev, {
                    status: subscriptionData.data.statusChanged
                });
            }
        });
    }

    componentWillUnmount() {
        clearInterval(this._interval);
        window.removeEventListener('beforeunload', this.onUnload);
        this.leaveRoom();
    }

    leaveRoom(event) {
        const { status } = this.props.data;
        if (!status || status.userid !== this.userid) {
            return;
        }

        this.props.leaveRoom({
            variables: {
                userid: this.userid
            }
        });
    }

    updateMessages(store, { data: { addMessage } }) {
        const data = store.readQuery({ query: query });
        data.messages.unshift(addMessage);
        store.writeQuery({ query: query, data });
    }

    render() {
        const {
            loading,
            error,
            messages,
            status
        } = this.props.data;

        let content;
        if (loading || error) {
            content = <h1>{error ? error.message : 'Loading...'}</h1>;
        } else if (!status.occupied || status.userid !== this.userid) {
            content = [
                <h1 key='title'>Please leave the stall.</h1>,
                <Link to='/' className={'button wipeButton'} key='button'>Wipe</Link>
            ];
        } else {
            const timeLeft = this.state.secondsRemaining;
            const messagesDom = messages.map(message => <Message message={message} key={message._id} />);

            content = (
                <div>
                    <h1>You are in the stall</h1>
                    <h2 className="subtitle">
                        <span>You have </span>
                        <span className="countdown">{timeLeft + (timeLeft === 1 ? ' second' : ' seconds')}</span>
                        <span> to do your business</span>
                    </h2>
                    <div className='messages'>
                        <SendMessage update={this.updateMessages.bind(this)}/>
                        {messagesDom}
                    </div>
                </div>
            );
        }

        return (
            <div className='room'>
                {content}
            </div>
        );
    }
}

export default compose(
    graphql(query),
    graphql(leaveRoom, {
        name: 'leaveRoom'
    })
)(Room);
