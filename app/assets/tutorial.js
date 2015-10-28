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


function step2() {	 	
 	document.getElementById("gm-bubble-content").onmouseover=step3;
}

function step3() {
	element = document.getElementById("gm-bubble-content");
	if (element.dataset.state != "disabled") {
		element.onmouseover=null;
		document.location.hash="step3";
		document.getElementById("gm-bubble-layer").onmouseover=step4;
	}
}

var observer = new MutationObserver(onMoved);

function step4() {	
	document.getElementById("gm-bubble-layer").onmouseover=null;
	document.location.hash="step4";	
	var main = document.getElementById("gm-bubble-content");	
	observer.observe(main, {
            attributes: true,
            attributeFilter: ["style"]
        });
	
}

function onMoved () {
	observer.disconnect();
	var main = document.getElementById("gm-bubble-content");	
	main.onmouseup = step5;
}

function step5() {	
	document.location.hash="step5";
}

function onHashChange() {
	hash = document.location.hash.replace('#','');
	if (hash.length == 0) {
		hash = "step2";		
	}
	document.getElementById("tut-container").setAttribute("data-step", hash);
	window[hash]();

}

function temporaryHide() {
	element = document.getElementById("gm-bubble-container");
	element.style.opacity = 0;
	bubbleHighlight = document.getElementById('bubble-highlight');
	bubbleHighlight.classList.add("pop-highlight");
	setTimeout(function() {
		element = document.getElementById("gm-bubble-container");
		bubbleHighlight.classList.remove("pop-highlight");
		element.style.opacity = 1;
	}, 1500)
};

function startTutorial() {
 	document.getElementById("gm-bubble-content").setAttribute("style", "bottom: calc(70% - 32px); right: calc(50% - 32px)");
 	document.body.appendChild(document.getElementById("tut-container"));
 	setTimeout(function() { document.getElementById("tut-container").setAttribute("class", "start"); }, 250);
 	document.body.onhashchange = onHashChange;
 	onHashChange();

 	document.getElementById('gm-bubble-blacklist').onclick=temporaryHide;
	document.getElementById('gm-bubble-hide').onclick=temporaryHide;
}

 window.onload=function() { setTimeout(startTutorial, 100) };