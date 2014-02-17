sap.ui.controller("customsapui5.menu", {

/**
* Called when a controller is instantiated and its View controls (if available) are already created.
* Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
* @memberOf customsapui5.menu
*/
	onInit: function() {
	},
	goToMainPage: function(){
		this.goToPage("_main");
	},
	goToSecondPage: function(){
		this.goToPage("_secondPage");
	},
	goToPage: function(oEvent){
		var oRouter = sap.ui.core.routing.Router.getRouter("appRouter");
		oRouter.navTo(oEvent.getParameter("item").getKey());

//		jQuery(function() {
//		sap.ui.template();
//		});
	}

/**
* Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
* (NOT before the first rendering! onInit() is used for that one!).
* @memberOf customsapui5.menu
*/
//	onBeforeRendering: function() {
//
//	},

/**
* Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
* This hook is the same one that SAPUI5 controls get after being rendered.
* @memberOf customsapui5.menu
*/
//	onAfterRendering: function() {
//
//	},

/**
* Called when the Controller is destroyed. Use this one to free resources and finalize activities.
* @memberOf customsapui5.menu
*/
//	onExit: function() {
//
//	}

});