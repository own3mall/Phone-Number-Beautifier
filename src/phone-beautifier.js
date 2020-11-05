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
	console.log("Phone Number Beautifier: Beautifying detected phone number of " + text + "!");
	var formattedPhoneNumber = "";
	text = text.replace(/\D+/g, '');
	var processedNums = 0;
	
	for(var i=text.length - 1; i >= 0; i--){
		formattedPhoneNumber = text[i] + formattedPhoneNumber;
		processedNums++;
		if(processedNums == 4){
			formattedPhoneNumber = '-' + formattedPhoneNumber;
		}
		
		if(processedNums == 7 && text.length > 7 && text.length >= 10){
			formattedPhoneNumber = ') ' + formattedPhoneNumber;
		}
		
		if(processedNums == 10 && text.length >= 10){
			formattedPhoneNumber = ' (' + formattedPhoneNumber;
		}
		
		if(processedNums > 10 && i == 0){
			formattedPhoneNumber = "+" + formattedPhoneNumber;
		}
	}
	
	return formattedPhoneNumber.trim();
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
	const send = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function() { 
        this.addEventListener('load', function() {
            console.log('XHR request completed, so now it\'s time to run the phone number beautifier again!');
			findPhoneNumbersAndReplace(document.body);
        });
        return send.apply(this, arguments);
    };
    console.log("Override default ajax behavior webrequest!");
}

function findPhoneNumbersInAllChildren(node) {
	var immediateText;
	var child;
	var matchParent;
    for (var i = 0; i < node.childNodes.length; i++) {
		child = node.childNodes[i];
		if(!isElementIgnoredElementPhoneBeautifier(child)){
			findPhoneNumbersInAllChildren(child);
			immediateText = [].reduce.call(child.childNodes, function(a, b) { return a + (b.nodeType === 3 ? b.textContent : ''); }, '');
			var phoneTextMatches = immediateText.match(/\bphone\b/gi);
			var poundSignMatches = immediateText.match(/#/gi);
			if((phoneTextMatches && phoneTextMatches.length) || (poundSignMatches && poundSignMatches.length) || (child.className && child.className.toLowerCase().includes('phone')) || (child.id && child.id.toLowerCase().includes('phone')) || (typeof child.getAttribute === "function" && child.getAttribute("name") && child.getAttribute("name").toLowerCase().includes('phone'))){
				if(!(child.className && child.className.toLowerCase().includes('phonebeautifierskip'))){
					matchParent = child.parentElement;
					if(matchParent && matchParent != null && !isElementIgnoredElementPhoneBeautifier(matchParent)){
						// Two levels if element is an inline element
						if(matchParent.parentElement && matchParent.parentElement != null && elemsToParse.indexOf(matchParent.parentElement) == -1 && !isElementIgnoredElementPhoneBeautifier(matchParent.parentElement) && isElementInlinePhoneNumberBeautifier(child)){
							elemsToParse.push(matchParent.parentElement);
						}else{
							// One level otherwise
							if(elemsToParse.indexOf(matchParent) == -1){
								elemsToParse.push(matchParent);
							}
						}
					}else{
						if(elemsToParse.indexOf(child) == -1){
							elemsToParse.push(child);
						}
					}
					
					child.setAttribute("data-phone-beautifier-number-formatted", "yes"); 
				}
			}
		}
	}
}

function isElementInlinePhoneNumberBeautifier(elem){
	var inlineElements = new Array('a', 'abbr', 'acronym', 'b', 'bdo', 'big', 'br', 'button', 'cite', 'code', 'dfn', 'em', 'i', 'img', 'input', 'kbd', 'label', 'map', 'object', 'output', 'q', 'samp', 'script', 'select', 'small', 'span', 'strong', 'sub', 'sup', 'textarea', 'time', 'tt', 'var');
	if(inlineElements.indexOf(elem.nodeName.toLowerCase()) != -1){
		return true;
	}
	return false;
}

function isElementIgnoredElementPhoneBeautifier(elem){
	var ignoredElements = new Array('img', 'body', 'script');
	if(ignoredElements.indexOf(elem.nodeName.toLowerCase()) != -1){
		return true;
	}
	return false;
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
console.log("Phone Number Beautifier initialized for page!");

let myPort = browser.runtime.connect({name:"port-from-cs"});

myPort.onMessage.addListener(function(m) {
	console.log("Phone Number Beautifier toolbar icon clicked. Running beautifier.");
	formatPhoneNumbers();
});
