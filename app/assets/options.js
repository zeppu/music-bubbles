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


var sites;

function onSitesLoaded(data) {
	sites = data.blacklisted;	
	blacklist = document.getElementById("blacklist");
	sites.forEach(
		function(entry) {
			option = document.createElement("option");
			option.value = entry;
			option.text = entry;
			blacklist.appendChild(option);
		}
		);
}

function removeItem() {
	blacklist = document.getElementById("blacklist");
	site = blacklist.options[blacklist.selectedIndex];
	sites.splice( sites.indexOf( site ), 1 );
	chrome.storage.sync.set({ "blacklisted" : sites }, function() { console.log(site.value + " removed from blacklist") });
	blacklist.remove(site);
}

function onDataLoaded(data) {
	document.getElementById('hideOnDisabled').checked = data.hideOnDisabled;
	document.getElementById('showTrackTitle').checked = data.showTrackTitle;

	if (data.blacklisted) {
		onSitesLoaded(data);
	}
}

function loadData() {
	chrome.storage.sync.get(onDataLoaded);
}

function resetData() {
	chrome.storage.sync.clear(
		function() {
			document.getElementById("reset-message").innerText = "(Done)";
			blacklist = document.getElementById("blacklist");
			for (i = 0; i < blacklist.options.length; i++) {
				blacklist.options[i] = null;
			}
		}
		);

}

function saveOption(data) {
	chrome.storage.sync.set(data);
	chrome.runtime.sendMessage({ refresh : true });
}

function onHideOnDisabledClick() {
	saveOption({ hideOnDisabled : this.checked});
}

function onShowTrackTitleClick() {
	saveOption({ showTrackTitle : this.checked });
}
	
loadData();
document.getElementById("removeItem").onclick=removeItem;
document.getElementById("reset").onclick=resetData;
document.getElementById('hideOnDisabled').onclick=onHideOnDisabledClick;
document.getElementById('showTrackTitle').onclick=onShowTrackTitleClick;
document.getElementById('fb_link').onclick=function() {
	window.open(this.href, 'mywin','left=20,top=20,width=500,height=500,toolbar=1,resizable=0'); 
	return false;
}