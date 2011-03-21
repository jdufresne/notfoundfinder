function NotFounder() {
	this.register();
}

NotFounder.prototype = {
	requests: [],
	updateCallback: null,

	setUpdateCallback: function(callback) {
		this.updateCallback = callback;
	},

	clearRequests: function() {
		this.requests = [];
	},

	observe: function(request, topic, data) {
		request.QueryInterface(Components.interfaces.nsIHttpChannel);
		if (request.responseStatus != 200) {
			this.requests.push(request);
			if (this.updateCallback) {
				this.updateCallback();
			}
		}
	},

	register: function() {
		var observerService = this._getObserverService();
		observerService.addObserver(this, 'http-on-examine-response', false);
	},

	unregister: function() {
		var observerService = this._getObserverService();
		observerService.removeObserver(this, 'http-on-examine-response');
	},

	_getObserverService: function() {
		return Components.classes['@mozilla.org/observer-service;1']
			.getService(Components.interfaces.nsIObserverService);
	},
};


function NotFounderController() {
	var self = this;
	window.addEventListener('load', function() { self.init(); }, false);
	window.addEventListener('unload', function() { self.shutdown(); }, false);
}

NotFounderController.prototype = {
	observer: null,

	init: function() {
		var self = this;

		var console = document.getElementById('nff-console');
		var splitter = document.getElementById('nff-splitter');
		console.collapsed = true;
		splitter.collapsed = true;

		var status = document.getElementById('nff-status');
		status.addEventListener('click', function() {
			self.toggleConsole();
		}, false);

		var button = document.getElementById('nff-clear-button');
		button.addEventListener('command', function() {
			self.observer.clearRequests();
			self.update();
		}, false);

		this.observer = new NotFounder();
		this.observer.setUpdateCallback(function() { self.update(); });
	},

	shutdown: function() {
		this.observer.unregister();
	},

	update: function() {
		var status = document.getElementById('nff-status');
		var num = this.observer.requests.length;
		status.label = "Not Found";
		if (num) {
			status.label += " (" + num + ")";
		 	status.setAttribute('class', 'warning');
		} else {
			status.removeAttribute('class');
		}

		var table = window.document.getElementById('nff-request-table');
		var nodes = [];
		for (var i = 0; i < table.childNodes.length; i++) {
			var node = table.childNodes[i];
			if (node.nodeType == node.ELEMENT_NODE &&
				node.nodeName == 'listitem') {
				nodes.push(table.childNodes[i]);
			}
		}
		while (nodes.length) {
			table.removeChild(nodes.pop());
		}
		for (var i = 0; i < this.observer.requests.length; i++) {
			var request = this.observer.requests[i];
			var row = window.document.createElement('listitem');
			var item;

			row.setAttribute('tooltiptext', request.URI.spec);

			item = window.document.createElement('listcell');
			item.setAttribute('label', request.URI.spec);
			row.appendChild(item);

			item = window.document.createElement('listcell');
			item.setAttribute(
				'label',
				request.responseStatus + " " + request.responseStatusText
			);
			row.appendChild(item);

			item = window.document.createElement('listcell');
			item.setAttribute(
				'label',
				request.requestMethod
			);
			row.appendChild(item);

			table.appendChild(row);
		}
	},

	toggleConsole: function() {
		var console = document.getElementById('nff-console');
		var splitter = document.getElementById('nff-splitter');
		console.collapsed = !console.collapsed;
		splitter.collapsed = console.collapsed;
	},
}


new NotFounderController();