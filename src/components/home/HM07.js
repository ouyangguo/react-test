/**
 * Created by ou on 2018/9/7.
 */
import React, {Component} from 'react';
class OnSale extends Component {
	render () {
		return (
			<div className="topic-wrap mb-20 clearfix">
				<div className="topic-img"><img src="../../images/pic/banner.jpg" width="100%" /><i></i></div>
				<div className="goods-list clearfix">
					<ul>
						<li>
							<div className="goods-img">
								<img src="../../images/pic/pic3.png" />
									<div className="lt-tag"><span>热销热销热销</span></div>
									<div className="rb-tag"><span>折</span><span>满减</span><span>包邮</span></div>
							</div>
							<div className="prod-info">
								<div className="tit-cont"><p className="prod-tit">格力高百力滋</p></div>
								<span className="prod-price">&yen; 108.00</span>
							</div>
						</li>
						<li>
							<div className="goods-img">
								<img src="../../images/pic/pic3.png" />
									<div className="lt-tag"><span>热销</span></div>
									<div className="rb-tag"><span>折</span></div>
							</div>
							<div className="prod-info">
								<div className="tit-cont"><p className="prod-tit"><img className="ht-goods" src="../../images/tips_overseas@3x.png" /> 格力高百力滋装饰饼干辣子鸡格力高百力滋装饰饼干辣子鸡</p></div>
								<span className="prod-price">&yen; 108.00</span>
							</div>
						</li>
						<li>
							<div className="goods-img">
								<img src="../../images/pic/pic3.png" />
									<div className="lt-tag"><span>热销</span></div>
									<div className="rb-tag"><span>包邮</span></div>
							</div>
							<div className="prod-info">
								<div className="tit-cont"><p className="prod-tit">格力高百力滋装饰饼干辣子鸡格力高百力滋装饰饼干辣子鸡</p></div>
								<span className="prod-price">&yen; 108.00</span>
							</div>
						</li>
						<li>
							<div className="goods-img">
								<img src="../../images/pic/pic3.png" />
									<div className="lt-tag"><span>热销</span></div>
									<div className="rb-tag"><span>包邮</span></div>
							</div>
							<div className="prod-info">
								<div className="tit-cont"><p className="prod-tit">格力高百力滋装饰饼干辣子鸡格力高百力滋装饰饼干辣子鸡</p></div>
								<span className="prod-price">&yen; 108.00</span>
							</div>
						</li>
						<li>
							<div className="see-more">
								<p>查看更多</p>
								<span>See more</span>
							</div>
							<!--<img src="../../images/pic_more@3x.png" width="100%">-->
						</li>
					</ul>
				</div>
			</div>
	
	)
	}
}

export default OnSale;