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
    playing: false,
    disabled: true
};

function performCommand(request) {
    if (request.command != null) {
        document.querySelector('#player').querySelector(request.command).click();
    }

    if (request.scroll != null) {
        volume = document.getElementById("volume");
        mouseEvent = new WheelEvent("mousewheel", {
            wheelDeltaY: request.scroll
        });
        volume.dispatchEvent(mouseEvent);
    }

}

function sendMessage(data) {
    port.postMessage(data);
}

function observeSongTitle() {
    gm_player.container = document.getElementById('playerSongInfo');

    songData = {};
    try {
        songData.songTitle = document.getElementById('player-song-title').textContent;
        songData.artist = document.getElementById('player-artist').textContent;
        songData.album = gm_player.container.getElementsByClassName('player-album')[0].textContent;
        songData.albumArtUrl = document.getElementById('playingAlbumArt').src;
        songData.duration = document.getElementById('material-player-progress').getAttribute('aria-valuemax');
        songData.durationAt = document.getElementById('material-player-progress').getAttribute('aria-valuenow');

        if (songData.durationAt == null) {
            songData.durationAt = 0;
        }
        songData.songStart = Date.now() - songData.durationAt;
    } catch (e) {}

   updatePlayerStatus("songData", songData);
}

function updatePlayerStatus(key, value) {
    if (gm_player[key] != value) {
        gm_player[key] = value;
        data = {};
        data[key] = value;
        sendMessage(data);
    }
}

function setEnabled(enabled) {
    console.log("enabled" + enabled);
    if (enabled) {
        observers.reattachObservers();
    }
    updatePlayerStatus("disabled", !enabled);
}

function observePlayButton(mutations) {
    console.log("BB");
    var playButton = document.querySelector('[data-id="play-pause"]');
    enabled = !playButton.hasAttribute("disabled");
    setEnabled(enabled);

    classes = playButton.getAttribute('class');
    if (classes != null && classes.length > 0 && classes.indexOf("playing") != -1) {
        updatePlayerStatus("playing", true);
    } else {
        updatePlayerStatus("playing", false);
    }

}

function observeThumbsButtons() {
    var up = document.querySelector('.player-rating-container [data-rating="5"]');
    var down = document.querySelector('.player-rating-container [data-rating="1"]');

    var rating = 3;
    if (up.querySelector('::shadow core-icon').getAttribute("aria-label").indexOf("outline") == -1) {
        rating = 5;
    } else if (down.querySelector('::shadow core-icon').getAttribute("aria-label").indexOf("outline") == -1) {
        rating = 1;
    }

    updatePlayerStatus("rating", rating);
}

var observers = {
    songTitleObserver: new MutationObserver(function(mutations) {
        observeSongTitle();
    }),
    playButtonObserver: new MutationObserver(function(mutations) {
        console.log("AA");
        observePlayButton();
    }),
    thumbsUpObserver: new MutationObserver(function(mutations) {
        observeThumbsButtons();
    }),
    thumbsDownObserver: new MutationObserver(function(mutations) {
        observeThumbsButtons();
    }),
    setupPlayObserver: function() {
        var playButton = document.querySelector('#player [data-id="play-pause"]');
        observers.playButtonObserver.observe(playButton, {
            attributes: true,
            attributeFilter: ["disabled", "class"]
        });
    },
    setupThumbsObserver: function() {
        var up = document.querySelector('.player-rating-container [data-rating="5"]::shadow core-icon');
        var down = document.querySelector('.player-rating-container [data-rating="1"]::shadow core-icon');
        if (up != undefined) {
            observers.thumbsUpObserver.observe(up, {
                attributes: true,
                attributeFilter: ["aria-label"]
            });
        }
        if (down != undefined) {
            observers.thumbsDownObserver.observe(down, {
                attributes: true,
                attributeFilter: ["aria-label"]
            });
        }
    },
    setupProgressbarObserver: function() {
        sliderKnob = document.getElementById('material-player-progress');
        // timeout because this has to arrive after the observe play-pause change
        sliderKnob.onmouseup = function() {
            setTimeout(observeSongTitle, 250);
        }
    },
    setupSongInfoObserver: function() {
        var songInfoContainer = document.querySelector('#playerSongInfo');
        if (songInfoContainer != undefined) {
            observers.songTitleObserver.observe(songInfoContainer, {
                attributes: true,
                subtree: true
            });
        }
    },
    reattachObservers: function() {
        this.setupPlayObserver();
        this.setupThumbsObserver();
        this.setupProgressbarObserver();
        this.setupSongInfoObserver();
    }
}

function init() {
    setTimeout(function() {
        if (player == undefined) {
            init();
        } else {
            observers.reattachObservers();
        }
    }, 2000);
}

var port = chrome.runtime.connect({
    name: "Google-Music-Bubbles"
});
port.onMessage.addListener(performCommand);

window.onload = init;