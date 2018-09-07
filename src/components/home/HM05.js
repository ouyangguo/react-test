/**
 * Created by ou on 2018/9/7.
 */
import React, {Component} from 'react';
class TodayGoods extends Component {
	render () {
		return (
			<div className="cate-wrap daily-good mb-20 clearfix">
				<div className="cate-head clearfix">
					<div className="ch-l fl">
						<div className="cate-icon fl"><img src="../../images/pic/icon_home_today@3x.png" /></div>
						<em className="ch-tit fl">今日好货</em>
					</div>
					<div className="ch-r fr"><span className="cate-desc">今日上新80款高颜值好货</span></div>
				</div>
				<div className="items-wrap dg-list clearfix">
					<ul>
						<li><img src="../../images/pic/20170327163740.jpg" /></li>
						<li><img src="../../images/pic/20170327163740.jpg" /></li>
						<li><img src="../../images/pic/20170327163740.jpg" /></li>
						<li><img src="../../images/pic/20170327163740.jpg" /></li>
					</ul>
				</div>
			</div>
	
	)
	}
}
export default TodayGoods;