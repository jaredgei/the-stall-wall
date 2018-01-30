import React from 'react';
import PropTypes from 'prop-types';
import {
    compose,
    graphql
} from 'react-apollo';
import gql from 'graphql-tag';
import Cookies from 'js-cookie';
import '../css/home.scss';

const query = gql`
    query statusQuery {
        status {
            occupied,
            userid,
            expires
        }
    }
`;
const mutation = gql`
    mutation enterRoom($userid: String!) {
        enterRoom(userid: $userid) {
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

class Home extends React.Component {
    static propTypes = {
        data: PropTypes.shape({
            loading: PropTypes.bool,
            error: PropTypes.object,
            status: PropTypes.object,
            subscribeToMore: PropTypes.func
        }).isRequired,
        mutate: PropTypes.func.isRequired,
        history: PropTypes.object
    };

    componentDidMount() {
        this.props.data.subscribeToMore({
            document: subscription,
            updateQuery: (prev, {subscriptionData}) => {
                if (!subscriptionData.data) {
                    return prev;
                }

                return Object.assign({}, prev, {
                    status: subscriptionData.data.statusChanged
                });
            }
        });
    }

    attemptEntry(event) {
        const { mutate, history } = this.props;
        const { status } = this.props.data;
        event.preventDefault();

        if (!status || status.occupied) {
            return;
        }

        const userid = Cookies.get('userid');
        mutate({
            variables: {userid: userid},
            update: (store, { data: { enterRoom } }) => {
                if (enterRoom.userid === userid) { // If success
                    history.push('/stall');
                }
            }
        });
    }

    render() {
        const {
            loading,
            error,
            status
        } = this.props.data;

        let extraButtonClasses = '';
        let buttonLabel;
        if (loading) {
            buttonLabel = 'Loading...';
        } else if (error) {
            buttonLabel = 'Error';
            extraButtonClasses = ' disabled';
        } else {
            buttonLabel = status.occupied ? 'Occupied' : 'Vacant';
            extraButtonClasses = status.occupied ? ' disabled' : '';
        }

        return (
            <div className='home'>
                <h1>The Stall Wall</h1>
                <img className='logo' src={'/static/images/logo.svg'} />
                <div className='description'>
                    <div>The most private chatroom.</div>
                    <div className='subtitle'>1 person at a time.</div>
                </div>
                <a
                    href="#"
                    onClick={this.attemptEntry.bind(this)}
                    className={'button' + extraButtonClasses}>
                    {buttonLabel}
                </a>
                <div className="copyright">&copy; Swordfish & West Co. LLC 2018</div>
            </div>
        );
    }
}

export default compose(
    graphql(query),
    graphql(mutation)
)(Home);
