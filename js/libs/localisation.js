/*\
 |*|
 |*|  IE-specific polyfill which enables the passage of arbitrary arguments to the
 |*|  callback functions of javascript timers (HTML5 standard syntax).
 |*|
 |*|  https://developer.mozilla.org/en-US/docs/DOM/window.setInterval
 |*|
 |*|  Syntax:
 |*|  var timeoutID = window.setTimeout(func, delay, [param1, param2, ...]);
 |*|  var timeoutID = window.setTimeout(code, delay);
 |*|
 \*/

var _st = window.setTimeout;

window.setTimeout = function(fRef, mDelay) {
    if(typeof fRef == "function") {
        var argu = Array.prototype.slice.call(arguments,2);
        var f = (function(){ fRef.apply(null, argu); });
        return _st(f, mDelay);
    }
    return _st(fRef,mDelay);
};

/**
 * Main localisation object
 * @param content Either JSON object or file path
 * @param json true: JSON Object, false: file
 */
var localisation = function(content, json){
	
	var jsonObject;
	var language;

    var loaded = false;

	// Must be file
	if(!json) {
        var http_request = new XMLHttpRequest();
		http_request.open("GET", content, true);
		http_request.onreadystatechange = function () {
		    var done = 4, ok = 200;
		    if (http_request.readyState == done && http_request.status == ok) {
		        jsonObject = JSON.parse(http_request.responseText);
                loaded = true;
                console.log(jsonObject);
            }
		};
        http_request.send(null);
    }else{
    	var JSONText = JSON.stringify(content);
	    jsonObject = JSON.parse(JSONText);
        loaded = true;
    }

    /**
     * Define the language
     * @param l
     */
    this.setLanguage = function(l){
    	if(l == "auto"){
    		var detected = window.navigator.userLanguage || window.navigator.language;
    		detected = detected.replace ("-","_");  // replace dash with underscore
	    	this.language = detected;
	    	console.log("Language Auto set to: "+this.language);
    	}
		else this.language = l;

        return this.language;
    };

    /**
     * Adds a select box to the page with the languages provided.
     * @param className
     * @return {HTMLElement}
     */
    this.createLanguageChooser = function(className, titleText){
        var CLCTimeout;
        if(loaded){
            var langs = [];
            for (var lang in jsonObject) {
                if (jsonObject.hasOwnProperty(lang)) {
                    var name = "";
                    // setup option name
                    if(jsonObject[lang].language_name) name = jsonObject[lang].language_name;
                    else name = lang;
                    var optionSettings = {
                        text: name,
                        value: lang
                    };
                    langs.push(optionSettings);
                }
            }
            // Get script tag
            var scripts = document.getElementsByTagName('script');
            var script = scripts[scripts.length-1];

            // create select box
            var selectBox = document.createElement("select");
            selectBox.className += className;

            // Add title option
            var option = document.createElement("option");
            option.text = titleText;
            selectBox.options.add(option);

            // Create options
            for(var i=0;i<langs.length;i++){
                option = document.createElement("option");
                option.text = langs[i].text;
                option.value = langs[i].value;
                selectBox.options.add(option);
            }

            // Insert into DOM
            script.parentNode.insertBefore(selectBox, script);

            clearTimeout(CLCTimeout);

            return selectBox;
        }else{
            CLCTimeout = setTimeout(this.createLanguageChooser, 100, className, titleText);
        }
    };

    /**
     * Return specified string
     * @param message
     * @return {*}
     */
	this.returnString = function(message){
		if(loaded) return jsonObject[this.language][message];
        else setTimeout(this.returnString, 100, message);
	};

    this.checkLoaded = function(){
        return loaded;
    }
	
};