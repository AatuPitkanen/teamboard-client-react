import page  from 'page';
import React from 'react';

import Action          from '../actions';
import UserAction      from '../actions/user';
import SettingsAction  from '../actions/settings';
import BroadcastAction from '../actions/broadcast';

import SettingsMixin  from '../mixins/settings';
import SettingsStore  from '../stores/settings';

import Dropdown     from '../components/dropdown';
import MemberDialog from '../components/dialog/board-members';

import UserVoice from '../components/user-voice';
import InfoView  from './dialog/view-info';
import AboutView from './dialog/view-about';

/**
 *
 */
export default React.createClass({
	propTypes: {
		title:            React.PropTypes.string.isRequired,
		showHelp:         React.PropTypes.bool,
		showBoardMembers: React.PropTypes.bool,
		board: (props) => {
			if(!props.board instanceof Board) throw new Error();
		}
	},

	mixins: [
    	SettingsMixin()
	],

	getInitialState() {
		return { dropdown: false, feedback: false, infoActive: false, aboutActive: false, membersActive: false, localesDropdown: false}
	},

	showWorkspace() {
		return page.show('/boards');
	},

	toggleMembersDialog() {
		this.setState({ membersActive: !this.state.membersActive });
	},

	toggleDropdown() {
		this.setState({ dropdown: !this.state.dropdown });
		if(this.state.localesDropdown)
			this.setState({ localesDropdown: !this.state.localesDropdown });
	},

	toggleInfoView() {
		this.setState({ infoActive: !this.state.infoActive });
	},

	toggleAboutView() {
		this.setState({ aboutActive: !this.state.aboutActive });
	},

	render: function() {
		let infoDialog = null;
		let aboutDialog = null;
		let activeClick = null;
		let infoIcon = null;

		if(!this.state.infoActive) {
			infoIcon = 'info';
			infoDialog = null;
			activeClick = this.toggleDropdown;
		} else {
			infoIcon = 'times';
			infoDialog = <InfoView onDismiss = { this.toggleInfoView } />;
			activeClick = () => {};
		}

		if(!this.state.aboutActive) {
			aboutDialog = null;
			activeClick = this.toggleDropdown;
		} else {
			aboutDialog = <AboutView onDismiss = { this.toggleAboutView } />;
			activeClick = () => {};
		}

		let infoButtonClass =
			React.addons.classSet({
				infobutton: true,
				pulsate: localStorage.getItem('infovisited') === null
					? true : false,
				active: this.state.infoActive
			});

		let userButtonClass =
			React.addons.classSet({
				avatar: true,
				active: this.state.dropdown
			});

		let membersButtonClass =
			React.addons.classSet({
				members: true,
				active: this.state.membersActive
			});

		let boardMembersDialog = null;

		if (this.state.membersActive) {
			boardMembersDialog = <MemberDialog board={this.props.board} onDismiss={this.toggleMembersDialog}/>
		}

		let showBoardMembers = !this.props.showBoardMembers ? null : (
			<div id="members" onClick={this.toggleMembersDialog} className={membersButtonClass}>
				<span className="fa fa-fw fa-users">
					<span className="user-amount">
						{this.props.board.members.size}
					</span>
				</span>
			</div>
		);

		let showInfo = !this.props.showHelp ? null : (
			<div id="info" onClick={this.toggleInfoView} className={infoButtonClass}>
				<span className={`fa fa-fw fa-${infoIcon}`}></span>
			</div>
			);

		let items = [
			{ icon: 'user',     content: this.state.locale.DROPDOWN_PROFILE,
			onClick: () => {
				return page.show('/profile')
			}
			},
			{ icon: 'language', content: this.state.locale.DROPDOWN_LOCALE,
				onClick: () => {
					this.setState({ localesDropdown: !this.state.localesDropdown });
				}
			},
			{
				content: (
					<UserVoice>
						<span className="fa fa-fw fa-bullhorn" />
						{this.state.locale.DROPDOWN_FEEDBACK}
					</UserVoice>
				)
			},
			{
				onClick: () => {
					this.toggleAboutView();
				},
				icon: 'question-circle', content: this.state.locale.DROPDOWN_ABOUT
			},
			{
				onClick: () => {
					UserAction.logout()
						.catch((err) => {
							BroadcastAction.add(err, Action.User.Logout);
						});
				},
				icon: 'sign-out', content: this.state.locale.DROPDOWN_LOGOUT
			}
		];
		let locales = [
			{flag: 'fi', content: 'Suomi', onClick: () => {
					SettingsAction.setSetting('locale', 'fi');
					this.toggleDropdown();
				}
			},
			{flag: 'se', content: 'Svenska', onClick: () => {
					SettingsAction.setSetting('locale', 'se');
					this.toggleDropdown();
				}
			},
			{flag: 'ru', content: 'русский', onClick: () => {
					SettingsAction.setSetting('locale', 'ru');
					this.toggleDropdown();
				}
			},
			{flag: 'gb', content: 'English', onClick: () => {
					SettingsAction.setSetting('locale', 'en');
					this.toggleDropdown();
				}
			}
		];
		return (
			<nav id="nav" className="nav">
				<img className="logo" src="/dist/assets/img/logo.svg"
					onClick={this.showWorkspace} />
				<h1 className="title">{this.props.title}</h1>
				{showBoardMembers}
				{showInfo}
				<div id="avatar" onClick={activeClick} className={userButtonClass}>
					<span className="fa fa-fw fa-user"></span>
				</div>
				<Dropdown show={this.state.dropdown} items={items} />
				<Dropdown className='locales' show={this.state.localesDropdown} items={locales} />
				{infoDialog}
				{boardMembersDialog}
				{aboutDialog}
			</nav>
		);
	}
});
