import React  from 'react';
import Hammer from 'hammerjs';

import Broadcast       from '../models/broadcast';
import BroadcastStore  from '../stores/broadcast';
import BroadcastAction from '../actions/broadcast';

const FADE_TIME = 2000;

/**
 *
 */
const Item = React.createClass({
	propTypes: {
		item: (props) => {
			if(!props.item instanceof Broadcast) throw new Error();
		}
	},

	componentDidMount() {
		this.fadeTimeout = setTimeout(() => {
			BroadcastAction.remove(this.props.item);
		}, FADE_TIME);

		new Hammer(this.getDOMNode()).on('tap', () => {
			clearTimeout(this.fadeTimeout);
			BroadcastAction.remove(this.props.item);
		});
	},

	componentWillUnmount() {
		clearTimeout(this.fadeTimeout);
		BroadcastAction.remove(this.props.item);
	},

	render() {
		return (
			<div className={`item ${this.props.item.type}`}>
				{this.props.item.content}
			</div>
		);
	}
});

/**
 *
 */
export default React.createClass({
	getInitialState() {
		return { broadcasts: BroadcastStore.getBroadcasts() }
	},

	changeListener() {
		this.setState({ broadcasts: BroadcastStore.getBroadcasts() });
	},

	componentDidMount() {
		BroadcastStore.addChangeListener(this.changeListener);
	},

	componentWillUnmount() {
		BroadcastStore.removeChangeListener(this.changeListener);
	},

	render() {
		return (
			<div className="broadcast-container">
				{this.renderItems()}
			</div>
		);
	},

	renderItems() {
		return this.state.broadcasts.map((broadcast) => {
			return <Item key={broadcast.id} item={broadcast} />;
		});
	}
});
