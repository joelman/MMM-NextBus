/* global Module */

/* Magic Mirror
 * Module: nextbus
 *
 * By 
 * MIT Licensed.
 */

var nextbus = "MMM-NextBus";

Module.register(nextbus, {
	defaults: {
	    updateInterval: 60000,
		retryDelay: 5000
		},
	    
	    requiresVersion: "2.1.0", // Required version of MagicMirror
	    
	    urlApi: "http://webservices.nextbus.com/service/publicJSONFeed",
	    
	    start: function() {
	    var self = this;
	    var dataRequest = null;
	    var dataNotification = null;
	    
	    //Flag for check if module is loaded
	    this.loaded = false;
		
	    this.getAgencyName();
	
	    setInterval(function() {
		    self.updateDom();
		}, this.config.updateInterval);
	},
	    
	getAgencyName: function() {
	    var self = this;
	    var agency = this.config.agency;
	    var url = this.urlApi + "?command=agencyList";

	    var f = function(json) {

		for(var i = 0; i < json.agency.length; i++) {
			
		    var a = json.agency[i];
		    // console.log(a);
		    if(a.tag == agency) {
			self.agency = a.title;
			
			// do this afterwards to make sure we have agency name
			self.getData();
			break;
		    }
		}
		
		console.log("No agency found for " + self.agency);
		
	    }
	    
	    this.getJSON(url, f, false);
	},
	    
	    getJSON: function(url, callback, retry) {

	    Log.log("fetching " + url);
	    var dataRequest = new XMLHttpRequest();
	    dataRequest.open("GET", url, true);
	    dataRequest.onreadystatechange = function() {
		// console.log(this.readyState);
		if (this.readyState === 4) {
		    // console.log(this.status);
		    if (this.status === 200) {
			var json = JSON.parse(this.response);

			callback(json);

		    } else if (this.status === 401) {
			self.updateDom(self.config.animationSpeed);
			Log.error(self.name, this.status);
			retry = false;
		    } else {
			Log.error(self.name, "Could not get agency list.");
		    }

		    if (retry) {
			self.scheduleUpdate((self.loaded) ? -1 : self.config.retryDelay);
		    }		
		}
	    }
	
	    dataRequest.send();
	},

    /*
     * getData
     * function example return data and show it in the module wrapper
     * get a URL request
     *
     */
    getData: function() {
	var self = this;
	console.log("nextbus getData");
	var retry = true;
	
	var url = this.urlApi + "?command=predictionsForMultiStops&a=" + this.config.agency;

	url += "&stops=" + this.config.stops.join("&stops=");

	// TODO: I would like to use getJSON here, but ... 
	console.log("fetching " + url);
	var dataRequest = new XMLHttpRequest();
	dataRequest.open("GET", url, true);
	dataRequest.onreadystatechange = function() {
	    // console.log(this.readyState);
	    if (this.readyState === 4) {
		// console.log(this.status);
		if (this.status === 200) {
		    // console.log(this.response);
		    self.processData(JSON.parse(this.response));
		} else if (this.status === 401) {
		    self.updateDom(self.config.animationSpeed);
		    Log.error(self.name, this.status);
		    retry = false;
		} else {
		    Log.error(self.name, "Could not load data.");
		}
		if (retry) {
		    self.scheduleUpdate((self.loaded) ? -1 : self.config.retryDelay);
		}
	    }
	    
	};
	
	dataRequest.send();
    },


    /* scheduleUpdate()
     * Schedule next update.
     *
     * argument delay number - Milliseconds before next update.
     *  If empty, this.config.updateInterval is used.
     */
    scheduleUpdate: function(delay) {
	var nextLoad = this.config.updateInterval;
	if (typeof delay !== "undefined" && delay >= 0) {
	    nextLoad = delay;
	}
	nextLoad = nextLoad ;
	var self = this;
	setTimeout(function() {
	    self.getData();
	}, nextLoad);
    },

    getDom: function() {
	var self = this;

	console.log("in getDom");
	// create element wrapper for show into the module
	var wrapper = document.createElement("div");
	wrapper.className = "nextbus_wrapper";

	// did we get the agency?
	console.log("agency: " + this.agency);
	if(!this.agency) {
	    wrapper.innerText = "NextBus Error: Couldn't get agency info from \"" + this.config.agency + "\"";
	    return wrapper;
	}

	// If this.dataRequest is not empty
	if (this.dataRequest) {

	    var wrapperDataRequest = document.createElement("div");

	    var id = "nextbus_table";
	    var table = document.getElementById(id);

	    if(table) {
		// Clear table
		var body = table.getElementsByTagName('tbody')[0];
		while(body.rows.length > 0)
		    body.deleteRow(-1);
	    } else {

		table = document.createElement("table");
		table.setAttribute("id", id);

		var header = document.createElement('thead');
		table.append(header);

		var row = header.insertRow();
		var cell = row.insertCell();
		
		cell.align = "center";
		cell.colSpan = 2;
		cell.innerHTML = (this.agency) ? this.agency : "Unkown Agency " + this.config.agency;
		
		table.className = "nextbus";

		table.append(document.createElement('tbody'));
	    }

	    var request = this.dataRequest;
	    
	    if(request.Error) {
		Log.error(request.Error.content);
	    } else {

		var body = table.getElementsByTagName('tbody')[0];

		for(var i = 0; i < request.predictions.length; i++) {
		    var prediction = request.predictions[i];

		    var row = body.insertRow();
		    var cell = row.insertCell(-1);
		    cell.align = "center";
		    cell.colSpan = 2;
		    cell.innerHTML = prediction.routeTitle + " &mdash; " + prediction.stopTitle;
		    
		    var direction = prediction.direction;

		    if(direction) {
			
			// is array?
			var directions = [direction]
			if(direction.length) {
			    directions = direction;
			}

			for(var d = 0; d < directions.length; d++) {

			    var row = body.insertRow();
			    var cell = row.insertCell(0);
			    cell.align = "left";
			    
			    var pCell = row.insertCell(-1);
			    pCell.align = "left";
			    pCell.width = "10%";
			    
			    var dir = directions[d];
			    cell.innerHTML = dir.title;
			    // console.log(dir);
			    var predictions = [];

			    // is array?
			    if(dir.prediction.length) {
				for(var p = 0; p < dir.prediction.length; p++) {
				    predictions.push(dir.prediction[p].minutes);
				}
			    } else {
				predictions.push(dir.prediction.minutes);
			    }
			    
			    pCell.innerHTML = predictions.join(", ");
			}
			
		    } else {
			var row = body.insertRow();
			var cell = row.insertCell(0);
			cell.colSpan = 2;
			cell.align = "left";
			cell.innerHTML = "No Predictions";
		    }
		}
	    }
	    
	    wrapper.appendChild(table);
	}
	
	// Data from helper
	if (this.dataNotification) {
	    var wrapperDataNotification = document.createElement("div");
	    wrapperDataNotification.className = "nextbus_updated";
	    // translations  + datanotification
	    var date = new Date(Date.parse(this.dataNotification.date));

	    var hours = date.getHours();
	    var ampm = "AM"
	    if(hours > 12) {
		hours -= 12;
		ampm = "PM";
	    }
	    
	    var minutes = date.getMinutes();
	    if(minutes < 10)
		minutes = "0" + minutes;
	    
	    wrapperDataNotification.innerHTML =  this.translate("UPDATE") + ": " + hours + ":" + minutes + " " + ampm;

	    wrapper.appendChild(wrapperDataNotification);
	}
	return wrapper;
    },

    getStyles: function() {
	return ["nextbus.css"]
    },
    
    getScripts: function() {
	return [];
    },

    // Load translations files
    getTranslations: function() {
	//FIXME: This can be load a one file javascript definition
	return {
	    en: "translations/en.json",
	    es: "translations/es.json"
	};
    },

    processData: function(data) {
	var self = this;

	this.dataRequest = data;

	if (this.loaded === false) { self.updateDom(self.config.animationSpeed) ; }
	this.loaded = true;

	// the data if load
	// send notification to helper
	this.sendSocketNotification(nextbus + "-NOTIFICATION_TEST", data);
    },

    // socketNotificationReceived from helper
    socketNotificationReceived: function (notification, payload) {
	if(notification === nextbus + "-NOTIFICATION_TEST") {
	    // set dataNotification
	    this.dataNotification = payload;
	    this.updateDom();
	}
    },
});
