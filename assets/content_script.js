// Copyright (C) 2014  Joseph DeBono

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program. If not, see <http://www.gnu.org/licenses/>.


var gm_player = {};
var blacklisted = false;
var retry = 0

function loadExtension(data) {
	if (!document.body) {
		return;
	}
	
	var gm_Bubble_Control = {
		excuteCommand : function() {			
			chrome.runtime.sendMessage({command: this.dataset.command});
		},
		blacklistUrl: function () {
			blacklisted = true;
			chrome.runtime.sendMessage({blacklist: window.location.hostname});
			document.getElementById("gm-bubble-content").remove();
		}, 
		selectPlayer: function() {
			chrome.runtime.sendMessage({selectPlayer : true});
		},
		scroll: function(e) {			
			chrome.runtime.sendMessage({scroll: e.wheelDelta});
			return false;
		}
	}

	if (data.bubble != null && data.bubble.length > 0 && !blacklisted) {
		
		if (retry < 3) {
			retry++;
			document.body.insertAdjacentHTML('beforeEnd',data.bubble);
			var content = document.getElementById("gm-bubble-content").addEventListener("DOMNodeRemoved", function(data) { if (data.target.id == "gm-bubble-content") { onSitesLoaded(data); } });

		} else {
			console.info("Music Bubbles removed three times; giving up");
		}	

		document.getElementById('gm-bubble-playPause').onclick=gm_Bubble_Control.excuteCommand;
		document.getElementById('gm-bubble-prev').onclick=gm_Bubble_Control.excuteCommand;
		document.getElementById('gm-bubble-next').onclick=gm_Bubble_Control.excuteCommand;
		document.getElementById('gm-bubble-like').onclick=gm_Bubble_Control.excuteCommand;
		document.getElementById('gm-bubble-dislike').onclick=gm_Bubble_Control.excuteCommand;

		document.getElementById('gm-bubble-blacklist').onclick=gm_Bubble_Control.blacklistUrl;
		document.getElementById('gm-bubble-main').onmousewheel=gm_Bubble_Control.scroll;

		document.getElementById('gm-bubble-content').ondblclick=gm_Bubble_Control.selectPlayer;
		setDraggable();	
		update(data);
	}
}

function update(data) {
	if (blacklisted) 
		return;
	gm_player = data;
	element = document.getElementById("gm-bubble-content");
	element.setAttribute("data-hideoption", data.hideOnDisabled	);
	
	if (data.disabled) {
		element.setAttribute("data-state", "disabled");
		progressBar.reset();
		return;
	}

	if (data.playing != null) {
		element.setAttribute("data-state", data.playing?"playing":"paused");		
		if (!data.playing) {
			progressBar.stop();
		}
	}

	if (data.rating != null) {
		element.setAttribute("data-rating", data.rating);		
	}

	if (data.songData != null && data.songData.songTitle != null) {
		element.setAttribute("data-active", "true");
		document.getElementById("gm-bubble-artist").textContent = data.songData.artist;
		document.getElementById("gm-bubble-song-title").textContent = data.songData.songTitle;
		var updated = data.updated;
		document.getElementById("gm-bubble-album-art").src = data.songData.albumArtUrl;
		progressBar.start(data.songData);
		

		if (updated) {
			showToast(element);
		}
	} else {
		element.setAttribute("data-active", "false")	
		progressBar.reset();
	}
}

function setLocation(obj) {
	chrome.storage.sync.set({ position: obj }, function() {});
	chrome.runtime.sendMessage( { position : obj });
}

function showToast(element) {
	element.classList.add("gm-bubble-notify");
	setTimeout(function() {
		element.classList.remove("gm-bubble-notify");
	}, 5000);
}


function onSitesLoaded(data) {
	sites = data.blacklisted;
	url = window.location.hostname;
	if (sites == undefined || sites.indexOf(url) == -1) {
		chrome.runtime.sendMessage({ boot : true}, loadExtension);
	} else {
		console.debug("GMB exiting: blacklisted");	
		blacklisted = true;
	}
}
chrome.storage.sync.get("blacklisted", onSitesLoaded);

chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
	update(request);
});

// Progress Bar Stuff

// SVG stuff

var progressBar = new function() {
	var self = this;
	self._init = false;
	self.timeout = null;	
	self.circ = Math.PI * 2;
	self.quart = Math.PI / 2;
	self.step = 0;
	self.songStart;

	this.startTimeout = function() {
		if (self.timeout != 0) {
			clearTimeout(self.timeout);	
			self.timeout = 0;
		}
		self.timeout = setTimeout(self.draw, self.step);
	}

	this.init = function() {
		if (self._init) 
			return;

		self.bg = document.getElementById('gm-bubble-progress');
		self.ctx = self.bg.getContext('2d');
		self.imd = null;

		self.ctx.beginPath();
		self.ctx.strokeStyle = '#fff';
		self.ctx.lineCap = 'butt';
		self.ctx.closePath();
		self.ctx.fill();
		self.ctx.lineWidth = 4.5;

		self.imd = self.ctx.getImageData(0, 0, 72, 72);

		self._init = true;
	}

	this.stop = function() {
	    clearTimeout(self.timeout);	
	}

	this.draw = function() {	
		if (gm_player.playing) {
			value = (Date.now() - self.songStart) / self.songData.duration;
	    	self.startTimeout();
	    }

	    if (!gm_player.playing) {
	    	value = self.songData.durationAt / self.songData.duration;	    	 
	    }

	    if (gm_player.disabled) {
	    	value = 0;
	    }

		self.drawArc(value);
	}

	this.drawArc = function(value) {
		self.init();
		self.ctx.putImageData(self.imd, 0, 0);
	    self.ctx.beginPath();
	    self.ctx.arc(32, 32, 28, -self.quart, ((self.circ) * value) -self.quart, false);
	    self.ctx.stroke();	    	
	}


	this.start = function(songData) {
	    self.reset();
	    self.songData = songData;
	    if (songData.songStart == null) {
			self.songStart = Date.now() - songData.durationAt;
	    } else {
	    	self.songStart = songData.songStart;
	    }
		self.step = songData.duration/180;
		self.stop();
	    self.draw();
	}

	this.reset = function() {
		this.drawArc(0);
	}


}

// End Progress Bar Stuff


// Drag Stuff
var draggable, container,dragData=null;
function setDraggable() {
	draggable=document.getElementById("gm-bubble-drag");
	container=document.getElementById("gm-bubble-content");
	if(window.addEventListener) {
		draggable.addEventListener('mousedown',startDrag,false);
		document.body.addEventListener('mousemove',drag,false);
		document.body.addEventListener('mouseup',stopDrag,false);
	}
	else if(window.attachEvent) {
		draggable.attachEvent('onmousedown',startDrag);
		document.body.attachEvent('onmousemove',drag);
		document.body.attachEvent('onmouseup',stopDrag);
	}
}


function startDrag(ev) {
if(!dragData) {
	containerOffset = document.getElementById("gm-bubble-content").dataset.state == "disabled"? 0 : 64;
	ev=ev||event;
		dragData={
		x: ev.clientX-container.offsetLeft-containerOffset,
		y: ev.clientY-container.offsetTop-containerOffset
		};
	};
}

function processDrag(ev) {
	posX = ev.clientX-dragData.x;
	posY = ev.clientY-dragData.y;
	maxX = document.body.clientWidth;
	maxY = window.innerHeight;
	pos = {};
	if(maxX / 2 > posX) {
		pos.left = posX;
		container.style.left= posX +"px";
		container.style.right=null;
	} else {
		pos.right = maxX -posX -64;
		container.style.right= pos.right +"px";
		container.style.left=null;
	}

	if(maxY / 2 > posY) {
		pos.top = posY;
		container.style.top= posY +"px";
		container.style.bottom=null;
	} else {
		pos.bottom = maxY - posY - 64;
		container.style.bottom= pos.bottom +"px";
		container.style.top=null;
	}	
	dragData.pos = pos;
}

function drag(ev) {
	if(dragData) {
		processDrag(ev||event);
	}
}

function stopDrag(ev) {
if(dragData) {
		processDrag(ev||event);
		setLocation(dragData.pos);
		dragData=null;
	}
}

// End Drag stuff

