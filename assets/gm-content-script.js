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
	buttons : null,
	playing : false,
	disabled : true
};

function getButtons() {
	if (gm_player.buttons == null) {
		player = document.getElementById('player')
		buttonElements = player.getElementsByClassName('flat-button');
		gm_player.buttons = {};
		for (var i = 0; i < buttonElements.length; i++) {
			id = buttonElements[i].getAttribute('data-id');
			if (id != null) {
				gm_player.buttons[id] = buttonElements[i];
			}
			if (id == "play-pause")	{
				playButtonObserver.observe(buttonElements[i], {attributes: true});				
			}
			if (id == "rewind") {
				buttonElements[i].onclick= function() { setTimeout(observeSongTitle, 100); };
			}
		}
	}

	thumbsContainer = document.getElementById('player').getElementsByClassName('rating-container');

	if (thumbsContainer != null && thumbsContainer.length > 0) {
		thumbs = thumbsContainer[0].children;

		for (var i = 0; i < thumbs.length; i++) {
			rating = thumbs[i].getAttribute('data-rating');			
			if (rating == 1) {
				gm_player.buttons.dislike = thumbs[i];				

			} else if (rating == 5) {
				gm_player.buttons.like = thumbs[i];
			}
		};

	}

	return gm_player.buttons;
}

function performCommand(request) {
	buttons = getButtons();
	if (request.command != null && buttons[request.command] != null) {
		buttons[request.command].click();		
	}

	if (request.scroll != null) {
		volume = document.getElementById("volume");		
		mouseEvent = new WheelEvent("mousewheel", { wheelDeltaY: request.scroll });		
  		volume.dispatchEvent(mouseEvent);
	}

}

function sendMessage(data) {
	port.postMessage(data);
}

function observeSongTitle() {
	gm_player.container 		= document.getElementById('player');

	songData = {};
	try {
		songData.songTitle 	= document.getElementById('playerSongTitle').textContent;
		songData.artist 	= document.getElementById('player-artist').textContent;
		songData.album		= gm_player.container.getElementsByClassName('player-album')[0].textContent;
		songData.albumArtUrl= document.getElementById('playingAlbumArt').src;
		songData.duration 	= document.getElementById('slider').getAttribute('aria-valuemax');
		songData.durationAt	= document.getElementById('slider').getAttribute('aria-valuenow');

		songData.liked = buttons.like.getAttribute('class').indexOf('selected') >= 0;
		songData.disliked = buttons.dislike.getAttribute('class').indexOf('selected') >= 0;

		if (songData.durationAt == null) {
			songData.durationAt = 0;
		}
		songData.songStart = Date.now() - songData.durationAt;
		
	} catch (e) {}


	buttons = getButtons();

	updatePlayerStatus("songData", songData);
}

function setObserveSongTitle(disabled) {
	if (!disabled) {
		songInfo = document.getElementById('playerSongInfo');
		songTitleObserver.observe(songInfo, { characterData : true, childList : true});
	}
}

function setObserveProgressBar(disabled) {
	if (!disabled) {
		gmProgressBar = document.getElementsByClassName('goog-slider-track')[0];
		progressBarObserver.observe(gmProgressBar, { attributeFilter : ['class'] });
		gmProgressBar.onclick = function() { setTimeout(observeSongTitle, 100); };
	}
}

function updatePlayerStatus(key, value) {
	if (gm_player[key] != value) {
		gm_player[key] = value;
		data = {};
		data[key] = value;
		

		if (key == "disabled") {
			setObserveSongTitle(value);
			setObserveProgressBar(value);
			setTimeout(function() {sendMessage(data);}, 500);
		} else {
			sendMessage(data);
		}
	}
}

function observePlayButton(target) {
	disabled = target.hasAttribute("disabled");
	updatePlayerStatus("disabled" , disabled);

	classes = target.getAttribute('class');
	updatePlayerStatus("playing", classes.indexOf("playing") != -1);
}

var playButtonObserver = new MutationObserver(function(mutations) {
	observePlayButton(mutations[0].target);
	observeSongTitle();
});

var songTitleObserver = new MutationObserver(function(mutations) {
	observeSongTitle();
});

var progressBarObserver = new MutationObserver(function(mutations) {
	observeSongTitle();
});


function init() {
	setTimeout(function() {		
		if (player == undefined) {
			init();
		} else {
			buttons = getButtons();
		}
	}, 2000);
}

var port = chrome.runtime.connect({name: "Google-Music-Bubbles"});
port.onMessage.addListener(performCommand);

window.onload = init;