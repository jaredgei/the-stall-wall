import React, {Component} from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import {
    compose,
    graphql
} from 'react-apollo';
import Cookies from 'js-cookie';
import gql from 'graphql-tag';

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

const addMessage = gql`
    mutation addMessage($text: String!, $userid: String!, $signature: String) {
        addMessage(text: $text, userid: $userid, signature: $signature) {
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
        addMessage: PropTypes.func.isRequired,
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

    handleKeyUp(event) {
        const scrollHeight = this.textarea.scrollHeight;
        this.textarea.style.height = 'auto';
        this.textarea.style.height = scrollHeight + 'px';
    }

    handleKeyDown(event) {
        if (event.keyCode === 13) {
            this.sendMessage(event);
        }
    }

    sendMessage(event) {
        event.preventDefault();
        const signature = this.nameInput.value;
        const text = this.textarea.value;
        if (this.sending || text.length === 0) {
            return;
        }
        this.sending = true;
        this.props.addMessage({
            variables: {
                text: text,
                userid: this.userid,
                signature: signature
            },
            optimisticResponse: {
                addMessage: {
                    text: text,
                    signature: signature,
                    _id: 'optimistic',
                    __typename: 'Message'
                }
            },
            update: (store, { data: { addMessage } }) => {
                const data = store.readQuery({ query: query });
                data.messages.unshift(addMessage);
                store.writeQuery({ query: query, data });
            }
        }).then(res => {
            this.nameInput.value = '';
            this.textarea.value = '';
            this.textarea.style.height = '0px';
            this.sending = false;
        });
    }

    render() {
        const {
            loading,
            error,
            messages,
            status
        } = this.props.data;

        let content;
        if (loading) {
            content = <h1>Loading...</h1>;
        } else if (error) {
            content = <h1>{error.message}</h1>;
        } else if (!status.occupied || status.userid !== this.userid) {
            content = [
                <h1 key='title'>Please leave the stall.</h1>,
                <Link to='/' className={'button wipeButton'} key='button'>Wipe</Link>
            ];
        } else {
            const timeLeft = this.state.secondsRemaining;
            const messagesDom = messages.map(message => {
                return (
                    <div key={message._id} className={'message ' + message._id}>
                        <div className='messageText'>&ldquo;{message.text}&rdquo;</div>
                        <div className='messageSignature'>{message.signature || 'Anonymous'}</div>
                    </div>
                );
            });

            content = (
                <div>
                    <h1>You are in the stall</h1>
                    <h2 className="subtitle">
                        <span>You have </span>
                        <span className="countdown">{timeLeft + (timeLeft === 1 ? ' second' : ' seconds')}</span>
                        <span> to do your business</span>
                    </h2>
                    <div className='messages'>
                        <div className='sendMessage'>
                            <input
                                type='text'
                                placeholder='Name (optional)'
                                ref={ref => this.nameInput = ref}
                                maxLength={20}
                            />
                            <div className='spacer'></div>
                            <textarea
                                type='text'
                                placeholder='Leave your mark...'
                                ref={ref => this.textarea = ref}
                                onKeyUp={this.handleKeyUp.bind(this)}
                                onKeyDown={this.handleKeyDown.bind(this)}
                            />
                            <a
                                href='#'
                                onClick={this.sendMessage.bind(this)}
                                className='sendButton'
                            >
                                <img className='logo' src={'/static/images/send.svg'} />
                            </a>
                        </div>
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
    graphql(addMessage, {
        name: 'addMessage'
    }),
    graphql(leaveRoom, {
        name: 'leaveRoom'
    })
)(Room);
