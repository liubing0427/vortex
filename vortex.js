+function(jquery, vortex, name){
	if(typeof jquery === 'function' && jquery){
		$[name] = vortex();
	} else {
		window[name] = vortex();
	}
}($, function(){
	(function(){
		var P = ["ms", "moz", "webkit", "o"];
		for (var N = 0; N < P.length && !window.requestAnimationFrame; ++N) {
			window.requestAnimationFrame = window[P[N] + "RequestAnimationFrame"];
			window.cancelAnimationFrame = window[P[N] + "CancelAnimationFrame"] || window[P[N] + "CancelRequestAnimationFrame"]
		}
	}());
	var defaults = {
		operands : 'img', //操作对象
		vortex_prefix : "data-vortex-", //用于保存css
		attributes : ["position", "z-index", "top", "left", "width", "height", "transform", "-webkit-transform", "-moz-transform", "-ms-transform", "-o-transform"], //需要保存的css
		browser_prefix : ["-ms-", "-webkit-", "-moz-", "-o-", ""], //浏览器前缀
		showVortexLine : true, //是否显示漩涡线
		showCircle : true, //是否显示圆
		minScale : 0.5, //最小缩放比例
		moveAll : true,
		moveSpeed : 1, //移动未在漩涡内的元素靠近漩涡的速度
	}, settings;
	var index = 303;
	var context;
	var added_mass = 0;
    var holeRadius = 20;
	var allElementsCount = 0;
	var operation = (function(){
		var isRuning;
		var logic;
		var requestID;
		var id = 0;
		function start(action) {
			logic = action;
			isRuning = true;
			requestID = requestAnimationFrame(animFun);
		};
		function stop() {
			isRuning = false;
			cancelAnimationFrame(requestID)
		};
		function drawCircle(){
			var canv = document.getElementById("canv");
			context.clearRect(0, 0, canv.width, canv.height);
			context.fillStyle = "rgb(255,255,255)";
			context.shadowColor = "rgba(0,0,0,0.2)";
			context.shadowBlur = .5*holeRadius;
			
			context.beginPath();
			context.arc(canv.width / 2, canv.height / 2, holeRadius, 0, 2 * Math.PI);
			context.closePath();
			context.fill();
			
			context.fillStyle = "rgb(0,0,0)";
			context.shadowColor = "rgba(255,255,255,0.2)";
			context.shadowBlur = .5*holeRadius;
			
			context.beginPath();
			context.arc(canv.width / 2, canv.height / 2, holeRadius-2, 0, 2 * Math.PI);
			context.closePath();
			context.fill();
			
			context.shadowColor = "none";
			context.shadowBlur = 0;

			holeRadius = 2 * Math.sqrt(added_mass / Math.PI) + 20;
		};
		function animFun() {
			if (!isRuning) {
				return;
			}
			if(settings.showCircle){
				drawCircle();
			}
			if (logic) {
				logic();
			}
			window.setTimeout(function() {
				requestID = requestAnimationFrame(animFun);
			}, 20);
		};
		Vector2 = function(x, y) {
			this.x = x;
			this.y = y
		};
		Vector2.prototype = {
			copy: function() {
				return new Vector2(this.x,this.y)
			},
			length: function() {
				return Math.sqrt(this.x * this.x + this.y * this.y)
			},
			sqrLength: function() {
				return this.x * this.x + this.y * this.y
			},
			normalize: function() {
				var Z = 1 / this.length();
				return new Vector2(this.x * Z,this.y * Z)
			},
			negate: function() {
				return new Vector2(-this.x,-this.y)
			},
			add: function(Z) {
				return new Vector2(this.x + Z.x,this.y + Z.y)
			},
			subtract: function(Z) {
				return new Vector2(this.x - Z.x,this.y - Z.y)
			},
			multiply: function(Z) {
				return new Vector2(this.x * Z,this.y * Z)
			},
			divide: function(aa) {
				var Z = 1 / aa;
				return new Vector2(this.x * Z,this.y * Z)
			},
			dot: function(Z) {
				return this.x * Z.x + this.y * Z.y
			}
		};
		Vector2.zero = new Vector2(0,0);
		Vector2.one = new Vector2(1,1);	
		Particle = function(element, velocity, dst, startStep) {
			this.id = id++;
			this.from = this.id;
			this.steps = this.from;
			this.position = velocity;
			this.velocity = velocity;
			this.$element = element;
			this.dst = dst;
			this.startStep = startStep;
			this.scale = 1;
			this.before = true;
		};
		Particle.prototype.update = function() {
			if(this.steps < 0) {
				this.steps = 0;
			}
			if (this.isReached()) {
				this.position = this.dst
			}
			if(!this.before && (this.steps < 40)){
				this.scale = this.steps / Math.min(this.from, 40);
				this.scale = Math.max(this.scale, settings.minScale);
				this.scale = Math.min(this.scale, 1);
			}
		};
		Particle.prototype.isReached = function() {
			return aroundEqual(this.position.x, this.dst.x, 5) && aroundEqual(this.position.y, this.dst.y, 5);
		};
		function getFrom(position, x, y){
			for(var i = 0; i < 360; i++){
				var r = 40*Math.pow(i,0.5);
				var dest = new Vector2(x+r*Math.sin(i), y+r*Math.cos(i));
				if(aroundEqual(position.x, dest.x, 50) && aroundEqual(position.y, dest.y, 50))
				{
					return i;
				}
			}
		};
		function ParticleSystem() {
			var ae = this;
			var itemArray = new Array();
			this.particles = itemArray;
			var callbackFunc = {
				particleComplete: null,
				allComplete: null
			};
			this.effectors = new Array();
			this.init = function(callback) {
				if (callback) {
					$.extend(callbackFunc, callback)
				}
			};
			this.emit = function(item) {
				itemArray.push(item)
			};
			var count = 0;
			this.render = function(x, y) {
				++count;
				for (var i in itemArray) {
					var item = itemArray[i];
					if (count < item.startStep) {
						continue;
					}
					if (count == item.startStep) {
						item.$element.css({
							position: "relative",
							zIndex: index
						});
					}
					item.update();
					if(item.before){
						item.from = getFrom(item.position, x, y);
						item.steps = item.from;
						if(!isNaN(item.steps)){
							item.before = false;
						}
					}
					var dest;
					if(!item.before){
						var r = 40*Math.pow(item.steps,0.5);
						// var r = 5*item.steps;
						dest = new Vector2(x+r*Math.sin(item.steps), y+r*Math.cos(item.steps));
					}
					else{
						if(settings.moveAll){
							var xincrement = (item.dst.x - item.position.x) > 0 ? settings.moveSpeed : -1 * settings.moveSpeed;
							var yincrement = (item.dst.y - item.position.y) > 0 ? settings.moveSpeed : -1 * settings.moveSpeed; 
							dest = item.position.add(new Vector2(xincrement, yincrement));
						}
						else{
							Drop(i);
						}
					}
					if(dest !== undefined){
						var tans = dest.subtract(item.velocity);
						item.position = dest;
						var style = "translate(" + tans.x + "px, " + tans.y + "px) ";
						style += "scale(" + item.scale + ")"; 
						Animate(item.$element, style);
						item.steps -= 0.4;
					}
					if (item.isReached()) {
						if (callbackFunc.particleComplete) {
							added_mass += 50/Math.max(allElementsCount, 1);
							callbackFunc.particleComplete(item);
						}
						Drop(i);
					}
				}
				if (this.particles.length == 0) {
					if (callbackFunc.allComplete) {
						callbackFunc.allComplete();
					}
				}
			};
			function Drop(i) {
				if (itemArray.length > 1) {
					itemArray[i] = itemArray[itemArray.length - 1];
				}
				itemArray.pop();
			};
		}
		var result = {
			Vector2: Vector2,
			Particle: Particle,
			ParticleSystem: ParticleSystem,
			start: start,
			stop: stop
		};
		return result;
	})();
	function aroundEqual(x, y, floatvalue) {
		if((Math.abs(x) + floatvalue) >= Math.abs(y) && (Math.abs(x) - floatvalue) <= Math.abs(y)){
			return true;
		}else{
			return false;
		}
	};
	function Animate($element, style) {
		var styles = {};
		for (var i = 0; i < settings.browser_prefix.length; ++i) {
			styles[settings.browser_prefix[i] + "transform"] = style;
		}
		$element.css(styles);
	};
	function saveCss(element) {
		for (var i = 0; i < settings.attributes.length; ++i) {
			var attr = settings.attributes[i];
			var name = settings.vortex_prefix + attr;
			var value = element.css(attr);
			element.data(name, value)
		}
	}
	function loadCss(element) {
		for (var i = 0; i < settings.attributes.length; ++i) {
			var attr = settings.attributes[i];
			var name = settings.vortex_prefix + attr;
			var value = element.data(name);
			element.css(attr, value);
			element.removeData(name)
		}
	}
	var g = 0;
	function start(x, y) {
		var system = new operation.ParticleSystem();
		system.init({
			particleComplete: function(particle) {
				loadCss(particle.$element);
				particle.$element.css('opacity', 0);
			},
			allComplete: function() {
				reverse();
			}
		});
		$(settings.operands).each(function(){
			recursion($(this), function($element){
				var T = Math.floor(g / 10) % 13;
				if (T < 1) {
					T = 1
				}
				var step = T;
				++g;
				saveCss($element);
				var offset = $element.offset();
				var V = offset.left + $element.width() / 2;
				var U = offset.top + $element.height() / 2;
				system.emit(new operation.Particle($element,new Vector2(V,U), new Vector2(x, y),step));
			});
		});
		allElementsCount = system.particles.length;
		if (g == 0) {
			reverse();
		}else{
			operation.start(function () {
				system.render(x,y);
			});
		}
	};
	function recursion($element, callback){
		if($element.children().length > 0){
			$element.children().each(function(){
				recursion($(this), callback);
			});
		}
		else{
			callback($element);
		}
	};
	function reverse(){
		if((2 * Math.sqrt(added_mass / Math.PI) + 20) > 0){
			added_mass -= 1;
		}
		else{
			operation.stop();
			$("#vortex-ul").remove();
			$("#canv").remove();
			$('body').fadeOut();
			window.setTimeout(function(){
				$('body').fadeIn();
				$(settings.operands).each(function(){
					recursion($(this), function($element){
						$element.css('opacity', 1);
					})
				});
			}, 1000);
		}
	};
	function init(options) {
		settings = $.extend({}, defaults, options);
		var x = $(window).width() / 2 + $(document).scrollLeft();
		var y = $(window).height() / 2 + $(document).scrollTop();
		if(settings.showVortexLine){
			addVortexLine(x,y, 360);
			addFrames();
		}
		if(settings.showCircle){
			addCircle(x, y);
		}
		start(x, y);
	};
	function addVortexLine(x, y, size){
		width = size;
		$("#vortex-ul").remove();
		var ul = document.createElement('ul');
		ul.id = "vortex-ul";
		$(ul).css('position', 'absolute');
		$(ul).css('width', size + 'px');
		$(ul).css('height', size + 'px');
		var top = y - (size/2);
		$(ul).css('top', top + 'px');
		$(ul).css('left', x + 'px');
		$(ul).css('transform', 'translateX(-50%)');
		$(ul).css('list-style', 'none');
		$(ul).css('margin', '0');
		$(ul).css('padding', '0');
		$(ul).css('border', '0');
		$(ul).css('font-size', '100%');
		$(ul).css('font', 'inherit');
		$(ul).css('vertical-align', 'baseline');
		var pos = 0;
		var factor = 20;
		var delay = 0;
		for (var i=1;i<13;i++){
			var li = document.createElement('li');
			size = size - factor;
			pos = pos + (factor/2);
			delay = delay + 0.1;
			left = (width-size)/2;
			$(li).css('position', 'absolute');
			//$(li).css('left', '50%');
			$(li).css('left', left + 'px');
			$(li).css('border', '4px solid transparent');
			$(li).css('border-top', '4px solid #aaaaaa');
			$(li).css('border-radius', '50%');
			//$(li).css('transform', 'translate(-50%)');
			$(li).css('animation-name', 'rotate');
			$(li).css('animation-duration', '1s');
			$(li).css('animation-timing-function', 'linear');
			$(li).css('animation-iteration-count', 'infinite');
			$(li).css('width', size + 'px');
			$(li).css('height', size + 'px');
			$(li).css('top', pos + 'px');
			$(li).css('animation-delay', delay + 's');
			$(li).css('vertical-align', 'baseline');
			$(li).css('margin', '0');
			$(li).css('padding', '0');
			ul.appendChild(li);
		}
		$("body")[0].appendChild(ul);
	};
	function addFrames(){
		var style = document.createElement('style');
		style.type = 'text/css';
		style.innerHTML = '@keyframes rotate {from {transform: rotate(0deg);}to {transform: rotate(360deg);}}';
		document.getElementsByTagName('head')[0].appendChild(style);
	};
	function addCircle(x, y){
	    var canv = document.createElement("canvas");
	    canv.id = "canv";
		canv.width = 70;
		canv.height = 70;
		$(canv).css('top', (y - 35) + 'px');
		$(canv).css('left', (x - 35) + 'px');
		$(canv).css('position', 'absolute');
		$("body")[0].appendChild(canv);
		context = canv.getContext("2d");
		context.fillStyle = "rgba(255,255,255,0.1)";
		context.fillRect(0, 0, canv.width, canv.height);
	};
	function stop() {
		operation.stop();
	};
	function dispose() {
		$("#vortex-ul").remove();
		$("#canv").remove();
		stop();
	};
	var vortex = {
		init: init,
		dispose: dispose
	};
	return vortex;
}, "vortex");
