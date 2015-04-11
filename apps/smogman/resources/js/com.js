$(window).on("load", function(){
	//页面入口
	sapp.page.go(location.hash.substr(1));

	//loading
	$("#loading").removeClass("in");
});

$(function(){
	//初始化
	sapp.init({
		page:".page",
		preload:3
	});

	//页面滑动逻辑
	sapp.event.on("SWIPE", function(e){
		if(sapp.page.now==1 && e.dir=="swipeUp") sapp.page.next();
		if(sapp.page.now==2 && e.dir=="swipeDown") sapp.page.prev();
		if(sapp.page.now==3 && e.dir=="swipeUp" && !game.isPlaying()) sapp.page.go(2);
		if(sapp.page.now==4) sapp.event.call("BACK_INDEX");
	});

	//自适应
	sapp.event.on("PAGE_RESIZE", function(e){
		$("#wrap").css("font-size", e.ratio*64+"px");
	});
	sapp.fill({
		target : ".main",
		 width : 640,
		height : 960,
		  mode : "contain"
	});


	//分享
	// var share = sapp.share({
	// 	text : $("meta[name='shareText']").attr("content"),
	// 	icon : $("meta[name='shareIcon']").attr("content")
	// });
	// sapp.event.on("SHARE", function(e){
	// 	Mar.Seed.request("sapp","click","share"); //分享统计
	// });


	//页面到达统计
	sapp.event.on("PAGE_NEXT",function(e){
		Mar.Seed.request("sapp","swipe",("page"+e.page));
	});
	sapp.audio.add("resources/audio/fly.mp3");
	sapp.audio.add("resources/audio/over.mp3");

});





//游戏逻辑
var game = (function(){
	var _e={}, _p={};

	_e.init = function(){
		window.DEBUG = false;
		Cut(function(root, container){
			_p.root = root;
			_p.stage = container;
			container.setAttribute("id", "gameStage");

			var win = $(window);
			var rw = 640;
			var rh = 960;
			win.resize(function(){
				var ww = win.width();
				var wh = win.height();
				root.viewbox(rw, rh, (ww/wh > rw/rh) ? "in" : "out");
			}).resize();
			$("#game").prepend(_p.stage);
			//
			_p.setTexture();
			_p.setItem();
		});
	};

	_p.setTexture = function(){
		Cut({
			name : "pipe_black",
			imagePath : "resources/images/pipe_black.png",
			cutouts : [
				{name:"main", x:  0, y:  0, width:240, height:1300}
			]
		});
		Cut({
			name : "pipe_white",
			imagePath : "resources/images/pipe_white.png",
			cutouts : [
				{name:"main", x:  0, y:  0, width:240, height:1300}
			]
		});
		Cut({
			name : "girl",
			imagePath : "resources/images/girl.png",
			cutouts : [
				{name:"", x:  0, y:  0, width:240, height:96}
			]
		});
		Cut({
			name : "girl_dead",
			imagePath : "resources/images/girl_dead.png",
			cutouts : [
				{name:"", x:  0, y:  0, width:240, height:96}
			]
		});
		Cut({
			name : "screen_1",
			imagePath : "resources/images/screen_1.png",
			cutouts : [
				{name:"", x:  0, y:  0, width:640, height:120}
			]
		});
		Cut({
			name : "screen_2",
			imagePath : "resources/images/screen_2.png",
			cutouts : [
				{name:"", x:  0, y:  0, width:1920, height:300}
			]
		});
		Cut({
			name : "screen_3",
			imagePath : "resources/images/screen_3.png",
			cutouts : [
				{name:"", x:  0, y:  0, width:1920, height:300}
			]
		});
	}

	_p.setItem = function(){
		_p.screen_1 = Cut.image("screen_1:").appendTo(_p.root).pin({alignX:0.5});
		_p.screen_2 = Cut.image("screen_2:").appendTo(_p.root).pin({alignY:1, alignX:0});
		_p.screen_3 = Cut.image("screen_3:").appendTo(_p.root).pin({alignY:1, alignX:0});
		_p.girl = Cut.image("girl:").appendTo(_p.root).pin({alignX:0.5, pivotX:.575, pivotY:.666, offsetX:-100, offsetY:(960-96)/2});

	}

	_p.createPipe = function(){
		var x = _p.mile + _p.root._pin._width;
		var y = -Math.random()*(1200-960)-100;
		var pipe = Cut.image("pipe_black:main").appendTo(_p.root).pin({offsetX:x, offsetY:y, pivotX:.375, pivotY:.68});
		_p.pipes.push(pipe);
		_p.pipeNum++;
		pipe.pos = {x:x, y:y};
		pipe.clean = false;
	}

	_p.render = function(){
		//移动速度
		_p.mile += 8;
		//背景移动
		_p.screen_2.pin({offsetX: (-_p.mile*0.3)%640});
		_p.screen_3.pin({offsetX: (-_p.mile*0.7)%640});
		for(var i=_p.pipeHead; i<_p.pipeNum; i++){
			var pipe = _p.pipes[i];
			//超出移除
			if(_p.mile - 240 > pipe.pos.x){
				_p.pipes[i] = null;
				_p.pipeHead = i+1;
				pipe.remove();
				continue;
			}
			//净化
			if(!pipe.clean && _p.mile + _p.root._pin._width/2 - 180 > pipe.pos.x){
				_p.pipeClean++;
				pipe.clean = true;
				pipe.image("pipe_white:main");
				pipe.tween(100).ease("bounce[in-out]").pin({scaleX:.2, scaleY:1.2}).tween(400).ease("bounce").pin({scaleX:1, scaleY:1});
				$("#scoreTop").text(_p.pipeClean);
			}
			//碰撞检测
			var girlBox = {
				x : _p.mile + _p.root._pin._width/2 - 100,
				y : _p.girl.pin("offsetY"),
				w : 100,
				h : 96
			}
			var pipeBoxTop = {
				x : pipe.pos.x + 70,
				y : pipe.pos.y,
				w : 60,
				h : 660
			}
			var pipeBoxBottom = {
				x : pipe.pos.x + 50,
				y : pipe.pos.y + 690 + 170,
				w : 80,
				h : 440
			}
			if(_p.hitTest(girlBox, pipeBoxBottom)
			|| _p.hitTest(girlBox, pipeBoxTop)
			|| _p.girlSy < 0
			|| _p.girlSy > 960
			){
				return _e.over();
			}

			//位置更新
			pipe.pin({offsetX:pipe.pos.x - _p.mile});
		}
		if(_p.mile/_p.pipeSpacing > _p.pipeNum) _p.createPipe();
		//
		_p.girlVy = _p.girlVy + _p.girlAy + 2;
		if(_p.girlVy<-30) _p.girlVy = -30;
		if(_p.girlVy>60) _p.girlVy = 60;
		_p.girlAy*=0.08;
		_p.girlSy += _p.girlVy*0.2;
		_p.girl.pin({offsetY:_p.girlSy, rotation:_p.girlVy/180});
	}
	_p.hitTest = function(box1, box2){
		if (box1.x >= box2.x && box1.x >= box2.x + box2.w) {  
            return false;  
        } else if (box1.x <= box2.x && box1.x + box1.w <= box2.x) {  
            return false;  
        } else if (box1.y >= box2.y && box1.y >= box2.y + box2.h) {  
            return false;  
        } else if (box1.y <= box2.y && box1.y + box1.h <= box2.y) {  
            return false;  
        }  
        return true; 
	}
	_p.onTag = function(){
		_p.girlAy=-120;
		sapp.audio.play("fly");
		event.preventDefault();
	}
	_e.start = function(callback){
		if(_p.playing) return;
		_p.playing = true;
		_p.pipes = [];
		_p.pipeNum = 0;
		_p.pipeHead = 0;
		_p.pipeClean = 0;
		_p.pipeSpacing = 400;
		_p.mile = 0;
		_p.girlVy = 0;
		_p.girlAy = 0;
		_p.girlSy = (960-96)/2;
		_p.girl.image("girl:").pin({offsetX:-100, offsetY:_p.girlSy, rotation:0, pivotX:.575, pivotY:.666});
		$("#scoreTop").text(_p.pipeClean);

		Cut.Mouse(_p.root, _p.stage);
		_p.ticker = setInterval(_p.render, 30);
		$("#game").addClass("playing").removeClass("over");
		$(document).on("touchstart", _p.onTag);
		_p.callback = callback;
	}
	_e.over = function(){
		$(document).off("touchstart", _p.onTag);
		clearInterval(_p.ticker);
		sapp.audio.play("over");
		_p.girl.image("girl_dead:").pin({pivotX:.66, pivotY:.60}).tween(800).ease("ease[out]").pin({offsetX:-240, offsetY:960, rotation:-6});
		setTimeout(function(){
			for(var i=_p.pipeHead; i<_p.pipeNum; i++){
				_p.pipes[i].remove();
			}
			$("#game").removeClass("playing").addClass("over");
			_p.playing = false;
			$("#scoreOver").text(_p.pipeClean);
			try{
				_p.callback (_p.pipeClean);
			}catch(e){}
		}, 1000);
	}
	_e.isPlaying = function(){
		return _p.playing;
	}

	return _e;
}());
