/**
 * Created by ou on 2018/9/7.
 */
import React, {Component} from 'react';
class Bland extends Component {
	render () {
		return (
			<div className="cate-wrap brand-sale mb-20 clearfix">
				<div className="cate-head clearfix">
					<div className="ch-l fl">
						<div className="cate-icon fl"><img src="../../images/pic/icon_home_brand@3x.png" /></div>
						<em className="ch-tit fl">品牌特卖</em>
					</div>
					<div className="ch-r fr"><span className="cate-desc">今日上新90个品牌促销</span></div>
				</div>
				<div className="items-wrap bs-list clearfix">
					<ul>
						<li>
							<div className="ad-img">
								<img src="../../images/pic/brand.jpg" />
									<div className="ad-tag-lb"><span className="tag-1">限量<br />秒杀购</span></div>
							</div>
						</li>
						<li>
							<div className="ad-img">
								<img src="../../images/pic/goods.jpg" />
									<div className="ad-tag-rb"><span className="tag-2">5<i>元</i></span></div>
							</div>
						</li>
						<li>
							<div className="ad-img">
								<img src="../../images/pic/goods.jpg" />
									<div className="ad-tag-rb"><span className="tag-2">58<i>元</i></span></div>
							</div>
						</li>
						<li>
							<div className="ad-img">
								<img src="../../images/pic/goods.jpg"/>
									<div className="ad-tag-rb"><span className="tag-2">588<i>元</i></span></div>
							</div>
						</li>
						<li>
							<div className="ad-img">
								<img src="../../images/pic/goods.jpg" />
									<div className="ad-tag-rb"><span className="tag-2">588<i>元</i></span></div>
							</div>
						</li>
					</ul>
				</div>
			</div>
	
	)
	}
}

export default Bland;