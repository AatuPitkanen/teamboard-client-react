'use strict';

var _        = require('lodash');
var page     = require('page');
var React    = require('react');

var UserType    = require('../constants/enums').UserType;
var AuthActions = require('../actions/auth');

var Logo   = require('./logo.jsx');
var Modal  = require('./modal.jsx');
var Avatar = require('./avatar.jsx');

var SideBar = React.createClass({
	propTypes: {

		/**
		 * The current user.
		 */
		user: React.PropTypes.shape({
			name: React.PropTypes.string.isRequired,
			type: React.PropTypes.oneOf(_.values(UserType)).isRequired,
		}),

		/**
		 * Width of the sidebar.
		 */
		width: React.PropTypes.number,
	},

	getDefaultProps: function() {
		return {
			user: {
				name: 'unknown',
				type: 'unknown',
			},
		}
	},

	getInitialState: function() {
		return {
			showDialog: false,
		}
	},

	_logout: function() {
		return AuthActions.logout();
	},

	_toggleDialog: function() {
		this.setState({ showDialog: !this.state.showDialog });
	},

	render: function() {
		// TODO Gravatar or something? Needs to relate to the user..
		var avatar = 'http://www.placecage.com/c/128/128';

		if(this.state.showDialog) {
			var dialog = (
				/* jshint ignore:start */
				<Modal onDismiss={this._toggleDialog}>
					<div className="dialog">
						<div className="dialog-content">
							<Avatar url={avatar} theme="light" large={true} />
							<div className="username">
								{this.props.user.name}
							</div>
						</div>
						<div className="dialog-footer">
							<button className="btn turquoise dialog-submit"
									onClick={this._toggleDialog}>
								Done
							</button>
							<button className="btn red dialog-cancel"
									onClick={this._logout}>
								Logout
							</button>
						</div>
					</div>
				</Modal>
				/* jshint ignore:end */
			);
		}

		return (
			/* jshint ignore:start */
			<div className="sidebar">
				<Logo   url="/boards" />
				<Avatar url={avatar} onClick={this._toggleDialog} />
				{dialog}
			</div>
			/* jshint ignore:end */
		);
	}
});

module.exports = SideBar;
