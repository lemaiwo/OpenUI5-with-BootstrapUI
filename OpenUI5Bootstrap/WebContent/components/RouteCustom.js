/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 * (c) Copyright 2009-2013 SAP AG or an SAP affiliate company. 
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */

jQuery.sap.declare("sap.custom.routing.Route");
jQuery.sap.require("sap.ui.base.EventProvider");
jQuery.sap.require("sap.ui.thirdparty.signals");
jQuery.sap.require("sap.ui.thirdparty.crossroads");

(function(){
	/**
	 * Instantiates a SAPUI5 Route
	 *
	 * @class
	 *
	 * @param {sap.ui.core.routing.Router} oParent The parent route
	 * @param {object} oConfig configuration object for the route 
	 * <ul>
	 *        <li>oConfig.pattern:           the url pattern where it needs to match agains</li>
	 *        <li>oConfig.name:              the name of the route</li>
	 *        <li>oConfig.view:              The name of a view that will be created, the first time this route will be matched. To place the view into a Control use the targetAggregation and targetControl. Views will only be created once.</li>
	 *        <li>oConfig.viewType:          The type of the view that is going to be created</li>
	 *        <li>oConfig.viewPath:          A prefix that will be prependet in front of the view eg: view is set to "myView" and viewPath is set to "myApp" - the created view will be "myApp.myView".</li>
	 *        <li>oConfig.targetParent:      the id of the parent of the targetControl - if targetParent is undefined and the route is a subroute, the targetControl of the parent route is taken.</li>
	 *        <li>oConfig.targetControl:     Views will be put into a container Control, this might be a Shell control or a NavContainer? if working with mobile, or any other container. The id of this control has to be put in here.</li>
	 *        <li>oConfig.targetAggregation: The name of an aggregation of the targetControl, that contains views. Eg: a NavigationContainer? has an aggregation Pages , another Example is the Shell it has Content.</li>
	 *        <li>oConfig.clearTarget:       Defines a boolean that can be passed to specify if the aggregation should be cleared before adding the View to it.</li>
	 *        <li>oConfig.callback: a function which is executed after the route matched</li>
	 *</ul>
	 * @param {sap.ui.core.routing.Route} oParent The parent route
	 *
	 * @public
	 * @name sap.ui.core.routing.Route
	 */
	sap.ui.base.EventProvider.extend("sap.ui.core.routing.Route", /** @lends sap.ui.core.routing.Route */ {

		constructor : function(oRouter, oConfig, oParent) {
			if (!oConfig.name) {
				jQuery.sap.log.error("A name has to be specified for every route");
			}
			
			var that = this,
				vRoute = oConfig.pattern;
			
			if (!jQuery.isArray(vRoute)) {
				vRoute = [vRoute];
			}

			if (jQuery.isArray(oConfig.subroutes)) {
				//Convert subroutes
				var aSubRoutes = oConfig.subroutes;
				oConfig.subroutes = {};
				jQuery.each(aSubRoutes, function(iSubrouteIndex, oSubRoute) {
					oConfig.subroutes[oSubRoute.name] = oSubRoute;
				});
			}
			this._aPattern = [];
			this._aRoutes = [];
			this._oParent = oParent;
			this._oConfig = oConfig;
			

			if (oConfig.subroutes) {
				jQuery.each(oConfig.subroutes, function(sRouteName, oSubRouteConfig) {
					if (oSubRouteConfig.name == undefined) {
						oSubRouteConfig.name = sRouteName;
					}
					oRouter.addRoute(oSubRouteConfig, that);
				});
			}
			
			if(oConfig.pattern === undefined) {
				//this route has no pattern - it will not get a matched handler. Or a crossroads route
				return;
			}
			
			jQuery.each(vRoute, function(iIndex, sRoute) {

				that._aPattern[iIndex] = sRoute;

				that._aRoutes[iIndex] = oRouter._oRouter.addRoute(sRoute);

				that._aRoutes[iIndex].matched.add(function() {
					var oArguments = {};
					jQuery.each(arguments, function(iArgumentIndex, sArgument) {
						oArguments[that._aRoutes[iIndex]._paramsIds[iArgumentIndex]] = sArgument;
					});
					that._routeMatched(oRouter, oArguments, true);
				});
			});
		},
		metadata : {
			publicMethods: ["getURL", "getPattern"]
		}

	});
	
	/**
	 * Returns the URL for the route and replaces the placeholders with the values in oParameters
	 * 
	 * @param {object} Parameters for the route
	 * @return {string} the unencoded pattern with interpolated arguments
	 * @public
	 */
	sap.ui.core.routing.Route.prototype.getURL = function (oParameters) {
		return this._aRoutes[0].interpolate(oParameters);
		
	};
	
	/**
	 * Return the pattern of the route. If there are multiple patterns, the first pattern is returned
	 * 
	 * @return {string} the routes pattern
	 * @public
	 */
	sap.ui.core.routing.Route.prototype.getPattern = function() {
		return this._aPattern[0];
	};
	
	/**
	 * Executes the behaviour when route is matched
	 * 
	 * @private
	 */
	sap.ui.core.routing.Route.prototype._routeMatched = function(oRouter, oArguments, bInital) {
		
		var oView,
			oParentInfo, 
			oTargetParent,
			oTargetControl;
		
		if (this._oParent) {
			oParentInfo = this._oParent._routeMatched(oRouter, oArguments);
			
			oTargetParent = oParentInfo.oTargetParent;
			oTargetControl = oParentInfo.oTargetControl;
			
		}

		var oConfig =  jQuery.extend({}, oRouter._oConfig, this._oConfig);
		if(oConfig["views"]){
			$.each(oConfig.views,function(key,value){
				var sViewName = value.view;
				if (value.viewPath) {
					sViewName = value.viewPath + "." + sViewName;
				}
				oView = oRouter.getView(sViewName, value.viewType);
				if(oView && oView["getController"] && oView.getController()["onBeforeShow"]){
					oView.getController().onBeforeShow();
				}
				oView.placeAt(value.div,"only");
			});
		}else if (((oTargetControl || oConfig.targetControl ) && oConfig.targetAggregation) || oConfig.div ) {
			//no parent view - see if there is a targetParent in the config
			if (!oTargetParent) {
				
				if (oConfig.targetParent) {
					oTargetControl = sap.ui.getCore().byId(oConfig.targetParent).byId(oConfig.targetControl);
				}
			
			} else {
				//target control was specified - ask the parents view for it
				if(oConfig.targetControl) {
					oTargetControl = oTargetParent.byId(oConfig.targetControl);
				}
			}
			
			if (!oTargetControl) {
				//Test if control exists in core (without prefix)
				oTargetControl =  sap.ui.getCore().byId(oConfig.targetControl);
			}
		
			if (oTargetControl) {
				var oAggregationInfo = oTargetControl.getMetadata().getJSONKeys()[oConfig.targetAggregation];
				if (oAggregationInfo) {
					//Set view for content
					var sViewName = oConfig.view;
					if (oConfig.viewPath) {
						sViewName = oConfig.viewPath + "." + sViewName;
					}
					oView = oRouter.getView(sViewName, oConfig.viewType);
					if (oConfig.clearTarget === true) {
						oTargetControl[oAggregationInfo._sRemoveAllMutator]();
					}
					oTargetControl[oAggregationInfo._sMutator](oView);
				}else {
					jQuery.sap.log.error("Control " + oConfig.targetControl + " does not has an aggregation called " + oConfig.targetAggregation);
				}
			} else if (oConfig.div ){
				var sViewName = oConfig.view;
				if (oConfig.viewPath) {
					sViewName = oConfig.viewPath + "." + sViewName;
				}
				oView = oRouter.getView(sViewName, oConfig.viewType);
				if(oView && oView["getController"] && oView.getController()["onBeforeShow"]){
					oView.getController().onBeforeShow();
				}
				oView.placeAt(oConfig.div,"only");
			}else {
				jQuery.sap.log.error("Control with ID " + oConfig.targetControl + " could not be found");
			}
			
			if (oConfig.callback) {
				oConfig.callback(this, oArguments, oConfig, oTargetControl, oView);
			}

			oRouter.fireRouteMatched({
				name: oConfig.name,
				arguments: oArguments,
				targetControl: oTargetControl,
				view: oView,
				config : oConfig
			});
			
			if(bInital) {
				oRouter.fireRoutePatternMatched({
					name: oConfig.name,
					arguments: oArguments,
					targetControl: oTargetControl,
					view: oView,
					config : oConfig
				});
			}
			
			return { oTargetParent : oView, oTargetControl : oTargetControl };
		}
		
		return true;
	};

}());
