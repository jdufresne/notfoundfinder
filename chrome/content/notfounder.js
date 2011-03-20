function NotFounder() {
	this.notFoundRequests = new Array();
	this.callback = null;
}

NotFounder.prototype = {
	setUpdateCallback: function(callback) {
		this.updateCallback = callback;
	},

	observe: function(subject, topic, data) {
		subject.QueryInterface(Components.interfaces.nsIHttpChannel);
		if (subject.responseStatus == 404) {
			this.notFoundRequests.push(subject);
			this.updateCallback();
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
	this.observer = new NotFounder();
	var controller = this;
	this.observer.setUpdateCallback(function() { controller.update(); });
	window.addEventListener('load', function() { controller.init(); }, false);
	window.addEventListener('unload', function() { controller.shutdown(); }, false);
}

NotFounderController.prototype = {
	init: function() {
		this.observer.register();
	},

	shutdown: function() {
		this.observer.unregister();
	},

	update: function() {
		var panel = document.getElementById('not-founder-panel');
		var num = this.observer.notFoundRequests.length;
		panel.label = "Not Found (" + num + ")";
		if (num) {
		 	panel.className = 'warning';
		}
	},
}


new NotFounderController();