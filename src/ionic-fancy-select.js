/*jslint white: true */
/*global angular */

(function () { // To stop JSHint/JSLint whing
"use strict";

angular.module("ionic-fancy-select", ["ionic"])

.directive("fancySelect", function($ionicModal) {
  return {
    // Only use as <fancy-select> tag
    restrict: "E",
    templateUrl: 'bower_components/ionic-fancy-select/templates/default-item-template.html',

    // The default attribute set
    scope: {
      items: "=", // Needs to have a value
      value: "=", // Needs to have a value
      form: "=",
      field: "@",
      validateSelect: "=",
      required: "=",
      valueChangedCallback: "&valueChanged", // The callback used to signal that the value has changed
      getCustomTextCallback: "&getCustomText" // The callback used to get custom text based on the selected value
    },

    // Hook up the directive
    link: function(scope, element, attrs) {
      var inputField = null;

      // Default values
      scope.multiSelect = attrs.multiSelect === 'true' ? true : false;
      scope.maxSelectCount = attrs.maxSelectCount || 1000;
      scope.allowEmpty = attrs.allowEmpty === 'false' ? false : true;

      // Text displayed on label
      scope.label = attrs.label || '';
      scope.text = attrs.text || '';
      scope.defaultText = attrs.text || '';
      scope.placeholder = attrs.placeholder || '';
      if(scope.form){
        scope.model = scope.form[scope.field];
      }
      //scope.model = { value: scope.value }

      // Header used in ion-header-bar
      scope.headerText = attrs.headerText || 'Select ' + (scope.label || ' an option');

      // css initialization
      scope.inputLabelCss = "";
      scope.textCss = "select-placeholder";
      scope.selectInputCss = "select-input-visible";

      // Data binding properties
      scope.checkedProperty = attrs.checkedProperty || "checked";
      scope.iconProperty = attrs.iconProperty || "icon";
      scope.textProperty = attrs.textProperty || "name";
      scope.textcategoryProperty = attrs.textcategoryProperty || "key";
      scope.valueProperty = attrs.valueProperty || "id";
      scope.subitemProperty = attrs.subitemProperty || "items";

      // The modal properties
      scope.modalTemplateUrl = attrs.modalTemplateUrl;
      scope.modalAnimation = attrs.modalAnimation;
      
      // Note properties
      scope.noteImg = attrs.noteImg || "";
      scope.noteText = attrs.noteText || "";
      scope.noteImgClass = attrs.noteImgClass || "";

      /* Initialise the modal
       * If a modal template URL has been provided, then use that,
       * otherwise use the default one, that uses the
       * "id" and "text" properties
       */
      if (scope.modalTemplateUrl) {
        $ionicModal.fromTemplateUrl(
          scope.modalTemplateUrl,
          {
            scope: scope,
            animation: scope.modalAnimation
          }
        ).then(function(modal) {
          scope.modal = modal;
        });

      } else {
        scope.modal = $ionicModal.fromTemplate(
          '<ion-modal-view> <ion-header-bar class="bar-positive"> <button class="button button-positive button-icon ion-ios-arrow-back" ng-click="hideItems()"/> <h1 class="title">{{headerText}}</h1> <button class="button button-positive button-icon ion-checkmark" ng-show="multiSelect" ng-click="validate()"/> </ion-header-bar> <ion-content> <ion-list> <ion-item class="item-checkbox" ng-if="multiSelect" ng-repeat="item in items"> <label class="checkbox"> <input type="checkbox" ng-checked="item.checked" ng-model="item.checked"> </label>{{item.Name}}</ion-item> <label class="item" ng-click="validate(item)" ng-if="!multiSelect" ng-repeat="item in items">{{item.Name}}</label> </div></ion-content></ion-modal-view>',
          {
            scope: scope,
            animation: scope.modalAnimation
          }
        );
      }

      /* When the scope is destroyed, remove the modal */
      scope.$on("$destroy", function() {
        scope.modal.remove();
      });
      
      scope.getItemText = function(item) {
        return scope.textProperty ? item[scope.textProperty] : item;
      };
	  
    scope.getCategoryText = function (item) {
          return scope.textcategoryProperty ? item[scope.textcategoryProperty] : item;
      };
      
      scope.getItemValue = function(item) {
        return scope.valueProperty ? item[scope.valueProperty] : item;
      };
	  
   scope.getSubItems = function (item) {
          return scope.subitemProperty ? item[scope.subitemProperty] : item;
      };
      
      // Gets the text for the specified values
      scope.getText = function(value) {
        // Push the values into a temporary array so that they can be iterated through
        var temp;
        if (scope.multiSelect) {
          temp = value ? value : []; // In case it hasn't been defined yet
        } else {
          temp = (value === null || (typeof value === "undefined")) ? [] : [value]; // Make sure it's in an array, anything other than null/undefined is ok
        }

        var text = "";
        if (temp.length && temp[0]) {
          // Concatenate the list of selected items
		  //Changed for subitems
           angular.forEach(scope.items, function(i, keyUp) {
                angular.forEach(scope.getSubItems(i), function (item, key) {
                for (var i = 0; i < temp.length; i++) {
                  if (scope.getItemValue(item) == temp[i]) {
                    text += (text.length ? ", " : "") + scope.getItemText(item);
                    break;
                  }
                }
                });
            });

          
        } else {
          // Just use the default text
          text = scope.defaultText;
          
        }

        // If a callback has been specified for the text
        return scope.getCustomTextCallback({value: value}) || text;
      };

      // Hides the list
      scope.hideItems = function(event) {
        scope.modal.hide();
      };
      
      // Raised by watch when the value changes
      scope.onValueChanged = function(newValue, oldValue) {       
        if(newValue != "")
        {
          scope.inputLabelCss = "has-input";
          scope.textCss = "select-text";
          // scope.selectInputCss = "select-input-visible"
        }
        else {
          scope.inputLabelCss = "";
          scope.textCss = "select-placeholder";
          // scope.selectInputCss = "select-input-invisible"
        }

        scope.text = scope.getText(newValue);
        
        if(scope.text != null && scope.text != "")
        {
          scope.model = scope.text
        }

        // trigger enter key so that auto-advance works.
        // inputField.trigger(jQuery.Event('keypress', {which: 13}));
        
        // Notify subscribers that the value has changed
        scope.valueChangedCallback({value: newValue});
      };

      // Shows the list
      scope.showItems = function(event) {
        scope.selectInputCss = 'select-input-invisible';

        inputField = event.target;
        event.preventDefault(); // Prevent the event from bubbling
        
        // For multi-select, make sure we have an up-to-date list of checked items
        if (scope.multiSelect) {
          // Clone the list of values, as we'll splice them as we go through to reduce loops
          var values = scope.value ? angular.copy(scope.value) : [];
          
           angular.forEach(scope.items, function (i, keyUp) {
              angular.forEach(scope.getSubItems(i), function (item, key) {
            // Not checked by default
            item[scope.checkedProperty] = false;
            
            var val = scope.getItemValue(item);
            for (var i = 0; i < values.length; i++) {
              if (val === values[i]) {
                item[scope.checkedProperty] = true;
                values.splice(i, 0); // Remove it from the temporary list
                break;
              }
            }
           });
		  });
        }

        scope.modal.show();
      };

      // Validates the current list
      scope.validate = function(item) {
        if (scope.multiSelect) {
          // Need to scan the list for selected items and push them into the value list
          scope.value = [];

          if (scope.items) {
              angular.forEach(scope.items, function(i, keyUp) {
                  angular.forEach(scope.getSubItems(i), function (item, key) {
                  if (item[scope.checkedProperty]) {
                    scope.value[scope.value.length] = scope.getItemValue(item);
                  }
                });
              });

        } else {
          // Just use the current item
          scope.value = scope.getItemValue(item);

        }

        if(scope.value.length != 0)
        {
          scope.selectInputCss = 'select-input-visible';
        }

        scope.hideItems();
        scope.$broadcast('itemSelected', {});
      };
      
      // Watch the value property, as this is used to build the text
      scope.$watch(function(){return scope.value;}, scope.onValueChanged, true);
    }
  };
})

;
}());