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


var gm_player = {
	playing : false,
	disabled : true,
	hideOnDisabled : false
};

function processCSUpdate(request, sender, sendResponse) {
	if (request.refresh) {
		bubble.refresh();
		messageContentScript(gm_player);
	}

	if(request.boot != undefined) {
		var status;
		if (gm_player.disabled) {			
			status = "disabled";
		} else {
			status = gm_player.playing?"playing":"paused";
		}
		gm_player.bubble = bubble.build().replace("{status}", status);
		sendResponse(gm_player);
	}

	if (request.command != undefined) {
		gm_port.postMessage({command: request.command});
	}

	if (request.scroll != undefined) {
		gm_port.postMessage({scroll: request.scroll});
	}

	if (request.blacklist != undefined) {
		blacklistDomain(request.blacklist);
	}

	if (request.position != undefined) {
		bubble.generatePosition(request);
	}

	if (request.selectPlayer) {
		selectPlayer();
	}
}

function messageContentScript(data) {
	chrome.tabs.query( { }, function(tabs){
		for (var i = 0; i < tabs.length; i++) {			
		    chrome.tabs.sendMessage(tabs[i].id, data, function(response) {});  
		}
	});

}

function trackUpdated(newData) {
	updated = false;
	if (gm_player["songData"] != null) {
		oldData = gm_player["songData"];
		updated = !(newData.songTitle == oldData.songTitle && newData.artist == oldData.artist);
	}

	return updated;
}

function processGMUpdate(request, sender) {
	gm_port = sender;
	if (request.disabled) {
		gm_player.disabled = true;		
		messageContentScript(gm_player);
		return;
	}

	var data = JSON.parse(JSON.stringify(gm_player));
	data.disabled = false;

	if (request.playing != null) {
		data.playing = request.playing;
	}

	if (request.songData != null) {
		data.updated = trackUpdated(request.songData) && gm_player.showTrackTitle;
		data.songData = request.songData;
	}

	messageContentScript( data );	
	gm_player = data;	
}

var bubble = new function() {
	var self = this;

	// Loading HTML File
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function() {
		if (this.readyState==4 && this.status==200) { 
			self.html = this.responseText; 
		}	
	}
	xhr.open("GET", chrome.extension.getURL('music.html'), true);
	xhr.send();


	// Load position from storage

    this.generatePosition = function(data) {
    	posStyle ="";
    	if (data.position != undefined) {
    		Object.keys(data.position).forEach(function(x) { posStyle += x+":"+data.position[x]+"px; " } );		    	
    	}

    	self.posStyle = posStyle;
    }

    this.shouldHideOnDisabled = function(data) {
    	gm_player.hideOnDisabled = data.hideOnDisabled;
    }

    this.shouldShowTrackTitle = function(data) {
    	gm_player.showTrackTitle = data.showTrackTitle;
    }

    this.refresh = function() {
		chrome.storage.sync.get("position", self.generatePosition);
		chrome.storage.sync.get("hideOnDisabled", self.shouldHideOnDisabled);
		chrome.storage.sync.get("showTrackTitle", self.shouldShowTrackTitle);
	}

	self.refresh();

    // return result;
	this.build = function() {
		if (self.html != null && self.posStyle != null)
		{
			return self.html.replace('{position}', self.posStyle).replace('{hide}', gm_player.hideOnDisabled);
		}
		else return "";
	}
};


// Google Music-background communication

var gm_port;

function onPortDisconnect() {
	console.log("Disconnected from Google Music Tab");
	gm_port = null;
	gm_player.disabled = true;
	messageContentScript(gm_player);
}

chrome.runtime.onConnect.addListener(function(port) {
	console.assert(port.name == "Google-Music-Bubbles");
	gm_port = port;
	gm_port.onDisconnect.addListener(onPortDisconnect);
	gm_port.onMessage.addListener(processGMUpdate);
	console.log("Connected to Google Music Tab");
});

// End



// Bubble-background communication

chrome.runtime.onMessage.addListener(processCSUpdate);

// End

function getVersion() {
	var details = chrome.app.getDetails();
	return details.version;
}

function defaultSettings() {
	data = { 
		showTrackTitle : true
	};
	chrome.storage.sync.set(data);
	bubble.refresh();
}

chrome.storage.sync.get("version", function(data) {
	prevVersion = data.version;
	if (prevVersion == undefined) {
		prevVersion = localStorage['version'];
		defaultSettings();
	}	
	var currVersion = getVersion();	
	chrome.storage.sync.set({version : currVersion });
	if (currVersion != prevVersion && prevVersion != null) {
		defaultSettings();
		chrome.tabs.create({
			url: chrome.extension.getURL('options.html')
		});
	}
});

chrome.storage.sync.get("tutorial", function(data) {
	if (data.tutorial != "1") {
		chrome.tabs.create({
			url: chrome.extension.getURL('tutorial.html')
		});
		chrome.storage.sync.set( { "tutorial" : "1" });
	}	
});

function blacklistDomain(url) {	
	chrome.storage.sync.get("blacklisted", function(data){
		sites = data.blacklisted;
		if (sites == undefined) {
			sites = [];
		}
		
		sites.push(url);
		chrome.storage.sync.set({ 'blacklisted' : sites }, function (){console.log(url +' blacklisted')});
	});
}

function selectPlayer() {
	chrome.windows.getCurrent(function(window) {
		if (gm_port == null) {
			chrome.tabs.create({ url : "https://music.google.com/" });
			return;
		}
		
		playerID = gm_port.sender.tab.windowId;
		if (window.id == playerID) {
			chrome.tabs.update(gm_port.sender.tab.id, { highlighted : true });
		} else {
			chrome.windows.update(playerID, { focused : true });
		}
	});
}