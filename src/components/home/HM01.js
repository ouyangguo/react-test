/**
 * Created by ou on 2018/9/7.
 */
import React, {Component} from 'react';
class Carousel extends Component {
	render() {
		return (
			<div className="m-carousel m-fluid m-carousel-photos">
				<div className="m-carousel-inner">
					<div className="m-item i-1 m-active">
						<div className="item">
							<div className="imgbox">
								<img src="../../images/pic/top_banner@3x.png" />
							</div>
						</div>
					</div>
					<div className="m-item i-2">
						<div className="item">
							<div className="imgbox">
								<img src="../../images/pic/top_banner@3x.png" />
							</div>
						</div>
					</div>
					<div className="m-item i-3">
						<div className="item">
							<div className="imgbox">
								<img src="../../images/pic/top_banner@3x.png" />
							</div>
						</div>
					</div>
				</div>
				<div className="m-carousel-controls m-carousel-bulleted">
					<a href="#" data-slide="1" className="m-active"></a>
					<a href="#" data-slide="2"></a>
					<a href="#" data-slide="3"></a>
				</div>
			
			</div>
		)
	}
}