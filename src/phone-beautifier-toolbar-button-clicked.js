let ports = [];

function connected(p) {
	ports[p.sender.tab.id] = p;
}

browser.runtime.onConnect.addListener(connected);

var greeting = "single";
browser.browserAction.onClicked.addListener(function(tab) {
		greeting = "single";
		ports[tab.id].postMessage({greeting: greeting});
	}
);
