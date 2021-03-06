/* GLOBALS */
var elemsToParse = new Array();
var running = false;

/* FUNCTIONS */
function formatPhoneNumbers(){
	findPhoneNumbersAndReplace(document.body);
}

function findPhoneNumbersAndReplace(elem){
	if(!running){
		running = true;
		elemsToParse = new Array();
		findPhoneNumbersInAllChildren(elem);
		
		for (var i = 0; i < elemsToParse.length; i++) {
			var matches = elemsToParse[i].innerHTML.match(/(\b|^\d|\+|\()(\+?\d{1,3}\s?)?(\d{1}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/gi);
			if(matches && matches.length){
				elemsToParse[i].innerHTML = elemsToParse[i].innerHTML.replace(/(\b|^\d|\+|\()(\+?\d{1,3}\s?)?(\d{1}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/gi, 'phoneNumberMatchPHBeautifier$&phoneNumberMatchPHBeautifier');
				beautifyPhoneNumbers(elemsToParse[i]);
			}
		}	
		running = false;
	}
}

function beautifyPhoneNumbers(elem){
	elem.innerHTML = elem.innerHTML.replace(/phoneNumberMatchPHBeautifier(.*?)phoneNumberMatchPHBeautifier/gi, function(match, capture){
		return beautifyPhoneNumber(capture);
	});
}

function beautifyPhoneNumber(text){
	console.log("Beautifying detected phone number of " + text + "!");
	var formattedPhoneNumber = "";
	text = text.replace(/\D+/g, '');
	var processedNums = 0;
	
	for(var i=text.length - 1; i >= 0; i--){
		formattedPhoneNumber = text[i] + formattedPhoneNumber;
		processedNums++;
		if(processedNums == 4 || processedNums == 7 || (processedNums == 10 && text.length > 10)){
			formattedPhoneNumber = '-' + formattedPhoneNumber;
		}
	}
	
	return formattedPhoneNumber;
}

function setupAjaxLoadFunctionPhoneNumberBeautifier(){
	var origOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function() {
        this.addEventListener('load', function() {
            console.log('XHR request completed, so now it\'s time to run the phone number beautifier again!');
            findPhoneNumbersAndReplace(document.body);
        });
        origOpen.apply(this, arguments);
    };
    console.log("Override default ajax behavior!");
}

function setupAjaxLoadFunctionPhoneNumberBeautifierWebRequest(){
	const send = XMLHttpRequest.prototype.send
    XMLHttpRequest.prototype.send = function() { 
        this.addEventListener('load', function() {
            console.log('XHR request completed, so now it\'s time to run the phone number beautifier again!');
			findPhoneNumbersAndReplace(document.body);
        })
        return send.apply(this, arguments)
    };
    console.log("Override default ajax behavior webrequest!");
}

function findPhoneNumbersInAllChildren(node) {
	var immediateText;
	var child;
	var matchParent;
    for (var i = 0; i < node.childNodes.length; i++) {
		child = node.childNodes[i];
		if(child.nodeName != 'SCRIPT'){
			findPhoneNumbersInAllChildren(child);
			immediateText = [].reduce.call(child.childNodes, function(a, b) { return a + (b.nodeType === 3 ? b.textContent : ''); }, '');
			var phoneTextMatches = immediateText.match(/\bphone\b/gi);
			var poundSignMatches = immediateText.match(/#/gi);
			if((phoneTextMatches && phoneTextMatches.length) || (poundSignMatches && poundSignMatches.length)){
				matchParent = child.parentElement;
				if(matchParent && matchParent != null && matchParent.nodeName != 'BODY'){
					// Go two levels up just in case
					if(matchParent.parentElement && matchParent.parentElement != null && elemsToParse.indexOf(matchParent.parentElement) == -1 && matchParent.parentElement.nodeName != 'BODY'){
						elemsToParse.push(matchParent.parentElement);
					}else{
						if(elemsToParse.indexOf(matchParent) == -1){
							elemsToParse.push(matchParent);
						}
					}
				}else{
					if(elemsToParse.indexOf(child) == -1){
						elemsToParse.push(child);
					}
				}
				
				/*
				if(!child.hasAttribute('data-phone-beautifier-number-formatted')){
					setupObservablePhoneNumberBeautifier(child);
				}*/
				
				child.setAttribute("data-phone-beautifier-number-formatted", "yes"); 
			}
		}
	}
}

function setupObservablePhoneNumberBeautifier(elem){
	// Setup observable on body changes
	var observer = new MutationObserver(function(mutations) {
		findPhoneNumbersAndReplace(document.body);
	});
	var config = { childList: true, characterData: true };
	observer.observe(elem, config);
	console.log("Watching " + elem.nodeName + " changes for reparsing of phone numbers!");
}

/* MAIN CODE */
console.log("Running phone number beautifier!");
window.addEventListener('load', function(event){
	var params = new URLSearchParams(window.location.search.substring(1));
	var skipAutoFormat = params.get('skip-phone-beautifier');
	if(!skipAutoFormat){
		formatPhoneNumbers();
		setTimeout(function(){ formatPhoneNumbers(); }, 3000);
	}
});

let myPort = browser.runtime.connect({name:"port-from-cs"});

myPort.onMessage.addListener(function(m) {
	console.log("In phone beautifier content script, received message from background script: ");
	console.log(m.greeting);
	if(m.greeting == "single"){
		formatPhoneNumbers();
	}else{
		// Disable for page and reload
		const urlParams = new URLSearchParams(window.location.search);
		urlParams.set('skip-phone-beautifier', 'yes');
		window.location.search = urlParams;
	}
});
