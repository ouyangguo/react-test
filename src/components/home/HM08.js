/**
 * Created by ou on 2018/9/7.
 */
import React, {Component} from 'react';

class FamousStore extends Component {
	render () {
		return (
			<div className="cate-wrap star-store mb-20 clearfix">
				<div className="cate-head clearfix">
					<div className="ch-l fl">
						<div className="cate-icon fl"><img src="../../images/pic/icon_home_star@3x.png" /></div>
						<em className="ch-tit fl">明星旗舰店</em>
					</div>
					<div className="ch-r fr arrow-link"><span className="cate-desc">今日上新90个品牌促销</span></div>
				</div>
				<div className="items-wrap store-list clearfix">
					<ul>
						<li>
							<a href="#"><img src="../../images/pic/20170328105520.jpg" /></a>
						</li>
						<li>
							<a href="#"><img src="../../images/pic/20170328105520.jpg" /></a>
						</li>
						<li>
							<a href="#"><img src="../../images/pic/20170328105520.jpg" /></a>
						</li>
						<li>
							<a href="#"><img src="../../images/pic/20170328105520.jpg" /></a>
						</li>
						<li>
							<a href="#"><img src="../../images/pic/20170328105520.jpg" /></a>
						</li>
						<li>
							<a href="#"><img src="../../images/pic/20170328105520.jpg" /></a>
						</li>
					</ul>
				</div>
			</div>
	
	)
	}
}

export default FamousStore;