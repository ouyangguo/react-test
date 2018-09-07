/**
 * Created by ou on 2018/9/7.
 */
import React, {Component} from 'react';

class thirdPartService extends Component {
	constructor(props) {
		super(props);
	}
	render() {
		let services = this.props.content.map((ad) => (
			<li>
				<div className="icon-cont"><img src={ad.iconsUrl} /></div>
				<div className="server-tit"><span>{ad.brief}</span></div>
			</li>
		));
		return (
			<div className="server-list clearfix" style={{background: 'url(../../images/pic/pic_icon@3x.png) no-repeat', 'background-size': '100% 100%', color: '#A53CC0'}}>
				<ul>
					{services}
				</ul>
			</div>
		)
	}
}