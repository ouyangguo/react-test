/**
 * Created by ou on 2018/9/7.
 */
import React, {Component} from 'react';
class HotCate extends Component {
	render () {
		return (
			<div className="cate-wrap hot-cate mb-20 clearfix">
				<div className="cate-head clearfix">
					<div className="ch-l fl">
						<div className="cate-icon fl"><img src="../../images/pic/icon_home_hot@3x.png" /></div>
						<em className="ch-tit fl">热门分类</em>
					</div>
					<div className="ch-r arrow-link fr"><span className="cate-desc">更多分类</span></div>
				</div>
				<div className="items-wrap hot-list clearfix">
					<ul>
						<li>
							<a href="#"><img src="../../images/pic/20170328112441.jpg" /></a>
						</li>
						<li>
							<a href="#"><img src="../../images/pic/20170328112441.jpg"/></a>
						</li>
						<li>
							<a href="#"><img src="../../images/pic/20170328112441.jpg"/></a>
						</li>
						<li>
							<a href="#"><img src="../../images/pic/20170328112441.jpg"/></a>
						</li>
						<li>
							<a href="#"><img src="../../images/pic/20170328112441.jpg"/></a>
						</li>
						<li>
							<a href="#"><img src="../../images/pic/20170328112441.jpg"/></a>
						</li>
						<li>
							<a href="#"><img src="../../images/pic/20170328112441.jpg"/></a>
						</li>
						<li>
							<a href="#"><img src="../../images/pic/20170328112441.jpg"/></a>
						</li>
					</ul>
				</div>
			</div>
		)
	}
}
export default HotCate;