import React, {Component} from 'react';
import PropTypes from 'prop-types';

import '../css/message.scss';

class Message extends Component {
    static propTypes = {
        message: PropTypes.shape({
            _id: PropTypes.string,
            text: PropTypes.string,
            signature: PropTypes.string
        }).isRequired
    };

    render() {
        const {message} = this.props;

        return (
            <div className={'message ' + message._id}>
                <div className='messageText'>&ldquo;{message.text}&rdquo;</div>
                <div className='messageSignature'>{message.signature || 'Anonymous'}</div>
            </div>
        );
    }
}

export default Message;
