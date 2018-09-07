/**
 * Created by ou on 2018/9/7.
 */
import React, {Component} from 'react';
class More extends Component {
	render() {
		return (
			<div className="cate-wrap more-service mb-20 v35 clearfix">
				<div className="cate-head clearfix">
					<div className="ch-l fl"><div className="cate-icon fl"><img src="../../images/pic/icon_home_service@3x.png"/></div>
						<em className="ch-tit fl">更多服务</em>
					</div>
				</div>
				<div className="items-wrap service-list clearfix">
					<ul>
						<li>
							<div className="service-items clearfix">
								<div className="si-logo fl"><img src="../../images/pic/icon_home_yundian@3x.png"/></div>
								<span className="fl">加入星链云店</span>
							</div>
						</li>
						<li>
							<div className="service-items clearfix">
								<div className="si-logo fl"><img src="../../images/pic/icon_home_yundian@3x.png"/></div>
								<span className="fl">深圳市怡亚通深圳市怡亚通深圳市怡亚通</span>
							</div>
						</li>
					</ul>
				</div>
			</div>
	
	)
	}
}
export default More;