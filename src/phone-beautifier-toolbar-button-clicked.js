let ports = [];
let tabCount = [];

function connected(p) {
	ports[p.sender.tab.id] = p;
	tabCount[p.sender.tab.id] = 0;
}

browser.runtime.onConnect.addListener(connected);

var delay = 250;    // Maximum time (milliseconds) between clicks to be considered a double-click
var timer;
var greeting = "single";
browser.browserAction.onClicked.addListener(function(tab) {
	tabCount[tab.id]++; 
	if(tabCount[tab.id] > 1){
		greeting = "double";
		
		/*
		ports.forEach( p => {
			p.postMessage({greeting: greeting})
		});
		*/
		
		tabCount[tab.id] = 0;
        clearTimeout(timer);
		
		// Current tab only
		ports[tab.id].postMessage({greeting: greeting});
		
	}else{
		timer = setTimeout(function(){  
			
			/*
			ports.forEach( p => {
				p.postMessage({greeting: greeting})
			});
			*/
			
			// Current tab only
			tabCount[tab.id] = 0;
			greeting = "single";
			ports[tab.id].postMessage({greeting: greeting});
			clearTimeout(timer);
		}, delay);
	}
});
