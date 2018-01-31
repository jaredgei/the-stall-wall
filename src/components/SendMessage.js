import React, {Component} from 'react';
import PropTypes from 'prop-types';
import gql from 'graphql-tag';
import {
    compose,
    graphql
} from 'react-apollo';
import Cookies from 'js-cookie';

import '../css/send_message.scss';

const addMessage = gql`
    mutation addMessage($text: String!, $userid: String!, $signature: String) {
        addMessage(text: $text, userid: $userid, signature: $signature) {
            _id,
            text,
            signature
        }
    }
`;

class SendMessage extends Component {
    static propTypes = {
        update: PropTypes.func.isRequired,
        addMessage: PropTypes.func.isRequired
    };

    constructor() {
        super();
        this.userid = Cookies.get('userid');
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

    blockReturn(event) {
        if (event.keyCode === 13) {
            event.preventDefault();
            this.textarea.focus();
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
            update: this.props.update
        }).then(res => {
            this.nameInput.value = '';
            this.textarea.value = '';
            this.textarea.style.height = '0px';
            this.sending = false;
        });
    }

    render() {
        return (
            <div className='sendMessage'>
                <textarea
                    className='nameInput'
                    type='text'
                    rows='1'
                    placeholder='Name (optional)'
                    ref={ref => this.nameInput = ref}
                    maxLength={15}
                    onKeyDown={this.blockReturn.bind(this)}
                />
                <div className='spacer'></div>
                <textarea
                    className='textInput'
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
        );
    }
}

export default compose(
    graphql(addMessage, {
        name: 'addMessage'
    })
)(SendMessage);
