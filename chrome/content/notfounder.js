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
	window: null,

	init: function() {
		var self = this;
		var status = document.getElementById('nff-status');
		status.addEventListener('click', function() { self.openWindow(); }, false);
		this.observer = new NotFounder();
		this.observer.setUpdateCallback(function() { self.update(); });
	},

	shutdown: function() {
		this.observer.unregister();
	},

	update: function() {
		var status = document.getElementById('nff-status');
		var num = this.observer.requests.length;
		status.label = "Not Found (" + num + ")";

		if (num) {
		 	status.setAttribute('class', 'warning');
		} else {
			status.removeAttribute('class');
		}

		if (this.window) {
			this.updateWindow();
		}
	},

	openWindow: function() {
		this.window = window.open(
			'chrome://notfounder/content/window.xul',
			'requests',
			'chrome,centerscreen'
		);

		var self = this;
		this.window.addEventListener('load', function() {
			var button = self.window.document.getElementById('nff-clear-button');
			button.addEventListener('command', function() {
				self.observer.clearRequests();
				self.update();
			}, false);
			self.updateWindow();
		}, false);
		this.window.addEventListener('close', function() {
			self.window = null;
		}, false);
	},

	updateWindow: function() {
		var table = this.window.document.getElementById('nff-request-table');
		var nodes = [];

		for (var i = 0; i < table.childNodes.length; i++) {
			if (table.childNodes[i].nodeName == 'listitem') {
				nodes.push(table.childNodes[i]);
			}
		}

		while (nodes.length) {
			table.removeChild(nodes.pop());
		}

		for (var i = 0; i < this.observer.requests.length; i++) {
			var request = this.observer.requests[i];
			var row = this.window.document.createElement('listitem');
			var item;

			item = this.window.document.createElement('listcell');
			item.setAttribute('label', request.URI.spec);
			row.appendChild(item);

			item = this.window.document.createElement('listcell');
			item.setAttribute(
				'label',
				request.responseStatus + " " + request.responseStatusText
			);
			row.appendChild(item);

			item = this.window.document.createElement('listcell');
			item.setAttribute(
				'label',
				request.requestMethod
			);
			row.appendChild(item);

			table.appendChild(row);
		}
	},
}


new NotFounderController();