import React from 'react/addons';
/**
 *
 */
const SingleBox = React.createClass({
	propTypes: {
		title: React.PropTypes.string,
		content: React.PropTypes.string,
		class:  React.PropTypes.string
	},

	getDefaultProps() {
		return {
			title: 'Title',
			content: 'Content',
			class: ''
		}
	},

	render() {
		return (
			<div className={`pos ${this.props.class}`}>
				<section className="dialog-header">
					{this.props.title}
				</section>
				<p>{this.props.content}</p>
			</div>
		);
	}

});

export default React.createClass({
	propTypes: {
		items: React.PropTypes.array,
		objects: React.PropTypes.array

	},

	getDefaultProps() {
		return { items: [ ], objects: [ ]}
	},

	render() {
		

		return (

			<div className="infospace">
				{this.props.objects}
				{this.props.items.map((item, index) => {
					return <SingleBox key={index} {...item} />;
				})}


			</div>
		);
	}
});