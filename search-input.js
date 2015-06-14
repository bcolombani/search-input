
var keycodes = {
    BACKSPACE: 8,
    TAB: 9,
    ENTER: 13,
    ESCAPE: 27,
    PAGE_UP: 33,
    PAGE_DOWN: 34,
    END: 35,
    HOME: 36,
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
    DELETE: 46,
    NUMPAD_ENTER: 108
};

var SuggestionDropdown = function(adapter, options) {
    this.options = $.extend({}, SuggestionDropdown.defaultOptions, options) ;
    this.view = $("<div>").addClass(this.options.styleClass) ;
    this.hintView = $("<div>").addClass(this.options.hintStyleClass) ;
    this.listView = new ListView( adapter, {
        styleClass : this.options.listStyleClass,
        blockBegin : true,
        blockEnd : true,
        selectFirstOnChange : true
    } ) ;
    
    this.view.append(this.hintView) ;
    this.view.append(this.listView.view) ;
    
    this.view.hide() ;
    
    adapter.on("reset remove add", function(event) { 
        (adapter.getCount()) ? this.hintView.hide() : this.hintView.show() ;
    }, this) ;
};

SuggestionDropdown.defaultOptions = {
    styleClass : "default-suggestion-dropdown",
    hintStyleClass : "default-suggestion-dropdown-hint",
    listStyleClass : "default-suggestion-dropdown-list"
} ;

SuggestionDropdown.prototype.on = function(events, handler, context) {
    this.listView.on(events, $.proxy(handler, context)) ; 
} ;

SuggestionDropdown.prototype.getList = function() {
    return this.listView ;
} ;

SuggestionDropdown.prototype.setHint = function(hint) {
    this.hintView.text(hint) ;
} ;

SuggestionDropdown.prototype.show = function() {
    this.view.show() ;
} ;

SuggestionDropdown.prototype.hide = function() {
    this.view.hide() ;
} ;

var StackItemAdapter = function(itemAdapter, options) {
    this.options = $.extend({}, StackItemAdapter.defaultOptions, options) ;
    this.itemAdapter = itemAdapter ;
    this.items = [] ;
};

StackItemAdapter.defaultOptions = {
    itemStyleClass : "default-stack-item",
    selectedItemStyleClass : "default-selected-stack-item",
    itemContentStyleClass : "default-stack-item-content",
    deleteButtonStyleClass : "default-stack-item-delete-button"
} ;

StackItemAdapter.prototype.getView = function(itemIndex) {
    var innerView = this.itemAdapter.getView(this.items[itemIndex], itemIndex);
    
    return this.wrapView(innerView, itemIndex) ;
} ;

StackItemAdapter.prototype.wrapView = function(view, itemIndex) {
    var wrapper = $("<div>").addClass(this.options.itemStyleClass);
    var deleteButton = $("<div>").addClass(this.options.deleteButtonStyleClass);
    var content = $("<div>").addClass(this.options.itemContentStyleClass)
    deleteButton.text("x") ;
    content.append(view) ;
    wrapper.append(content) ;
    wrapper.append(deleteButton) ;
    
    var item = this.items[itemIndex];
    deleteButton.on("mousedown", $.proxy(function(event) {
        this.removeItem(item) ;
        event.preventDefault() ;
    }, this)) ;
    
    return wrapper ;
} ;

StackItemAdapter.prototype.getItem = function(itemIndex) {
    return this.items[itemIndex] ;
} ;

StackItemAdapter.prototype.on = function(event, handler, context) {
    $(this).on(event, $.proxy(handler, context)) ;
} ;

StackItemAdapter.prototype.selectItem = function(itemIndex, view) {
    view.addClass(this.options.selectedItemStyleClass) ;
} ;

StackItemAdapter.prototype.unselect = function(itemIndex, view) {
    view.removeClass(this.options.selectedItemStyleClass) ;
} ;

StackItemAdapter.prototype.getCount = function() {
    return this.items.length ;
} ;

StackItemAdapter.prototype.addItem = function(item) {
    var alreadyInList = false ;
    for(itemIndex in this.items) {
        if(this.itemAdapter.equals(this.items[itemIndex], item)) {
            alreadyInList = true ;
        }
    }
    if(!alreadyInList) {
        this.items.push(item) ;
        $(this).trigger("add", [this.items.length-1, item]) ;
    }
    
    return !alreadyInList ;
} ;

StackItemAdapter.prototype.removeItemAt = function(itemIndex) {
    var oldItem = this.items[itemIndex];
    this.items.splice(itemIndex, 1) ;
    $(this).trigger("remove", [itemIndex, oldItem]) ;
} ;

StackItemAdapter.prototype.removeItem = function(item) {
    var itemIndex = false;
    for(currentItemIndex in this.items) {
        if(this.items[currentItemIndex] === item) {
            itemIndex = currentItemIndex ;
            break ;
        }
    }
    
    if(itemIndex !== false) {
        this.removeItemAt(itemIndex) ;
    }
} ;

StackItemAdapter.prototype.resetItems = function(items) {
    this.items = items.slice(0) ; // clone
    $(this).trigger("reset", []) ;
} ;

StackItemAdapter.prototype.getItems = function() {
    return this.items ;
} ;

StackItemAdapter.prototype.releaseView = function(itemView) {
    // TODO
} ;

var SearchEdit = function(stackedItemAdapter, options) {
    this.options = $.extend({}, SearchEdit.defaultOptions, options) ;
    
    /* Create a text input that will receive all key strokes */
    this.input = $("<input type='text' autocomplete='off'>").addClass(this.options.inputStyleClass) ;

    /* Create the stacked item list view */
    this.stackedItemListAdapter = new StackItemAdapter(
            stackedItemAdapter,
            {
                    itemStyleClass : this.options.stackItemClass,
                    selectedItemStyleClass : this.options.selectedStackItemClass,
                    itemContentStyleClass : this.options.stackItemContentStyleClass,
                    deleteButtonStyleClass : this.options.stackItemDeleteButtonStyleClass
            }
    ) ;
    this.stackedItemList = new ListView(
            this.stackedItemListAdapter,
            {
                    styleClass : stackedItemAdapter,
                    blockBegin : true,
                    blockEnd : false,
                    selectOnHover : false,
                    selectOnClick : true
            }
    ) ;
    /* Build the view */
    this.view = $("<div>").addClass(this.options.styleClass) ;
    this.view.append(this.stackedItemList.view) ;
    this.view.append(this.input) ;
   
   /* Register events */
    this.input.on("keydown", $.proxy(this.onKeydown, this)) ;
    this.input.on("keyup", $.proxy(this.onInputChanged, this)) ;
    this.input.on("blur", $.proxy(function() {
        this.stackedItemList.unselectItem() ;
        $(this).trigger("blur") ;
    }, this)) ;
    this.input.on("focus", $.proxy(function() {
        $(this).trigger("focus") ;
    }, this)) ;
    
    /* Catch clicks on the whole div to focus the text input, this is tricky
     * since the div contains the search input, a click received on the input
     * will also trigger a click in the div.
     * - When the user clicks the div, prevent default 
     * - When the user clicks the input, prevent propagation to avoid prevent default
     * - Fire fox needs the focus to be set both mouse down and up
     * - Chrome needs to process the mouse up to restart caret blicking, so dont prevent default on mouse up
     * - Focus must be set on keydown since it may change the focus
     * - Must tell the listeners to "select" the input when user clicked the view
     * */
    this.view.mousedown($.proxy(function(event) {
        this.input.focus() ; 
        event.preventDefault() ; 
    }, this)) ;
    this.view.mouseup($.proxy(function(event) {
        this.input.focus() ; 
    }, this)) ;
    this.input.on("mouseup mousedown", $.proxy( function(event) {
        this.stackedItemList.unselectItem() ;
        event.stopPropagation() ; 
    }, this)) ;
    /* Also focus the input when a stacked item is clicked, to continue catching keystrokes */
    this.stackedItemList.on("itemClicked", $.proxy(function(event, itemIndex, item)  {
        this.input.focus() ; 
    }, this)) ;
   
    /* Keep previous input value all the time to trigger changes correctly */
    this.previousValue = this.input.val() ;
    /* Set a selection attribute */
    this.selected = false ;
};

SearchEdit.defaultOptions = {
    styleClass : "default-search-edit",
    inputStyleClass : "default-search-edit-input",
    stackItemClass : "default-stack-item",
    selectedStackItemClass:"default-selected-stack-item",
    stackItemContentStyleClass:"default-stack-item-content",
    stackItemDeleteButtonStyleClass:"default-stack-item-delete-button"
};

SearchEdit.prototype.onInputChanged = function() {
    if(this.previousValue !== this.input.val()) {
        this.previousValue = this.input.val() ;
        $(this).trigger("patternChanged", [this.previousValue]) ;
        this.input.attr('size', (this.input.val().length) || 1);
        this.stackedItemList.unselectItem() ;
    }
} ;

SearchEdit.prototype.onKeydown = function(event) {
    switch(event.keyCode) {
        case keycodes.DOWN :
            $(this).trigger("down") ;
            break ;
        case keycodes.UP :
            $(this).trigger("up") ;
            event.preventDefault() ;
            break ;
        case keycodes.LEFT :
            if((this.input[0].selectionStart === 0) && (this.input[0].selectionEnd === 0)){
                this.stackedItemList.selectPreviousItem() ;
                event.preventDefault() ;
            }
            break ;
        case keycodes.RIGHT :
            if(this.stackedItemList.getSelectedItemIndex()  !== false) {
                this.stackedItemList.selectNextItem() ;
                event.preventDefault() ;
            }
            break ;
        case keycodes.ENTER : // no break
        case keycodes.NUMPAD_ENTER :
            $(this).trigger("enter") ;
            event.preventDefault() ;
            break ;
        case keycodes.BACKSPACE :
            if(this.stackedItemList.getSelectedItemIndex()) { // not false nor 0
               this.stackedItemListAdapter.removeItemAt(this.stackedItemList.getSelectedItemIndex()-1) ;
               event.preventDefault() ;
            } else if(this.stackedItemListAdapter.getCount()) {
               if((this.input[0].selectionStart === 0) && (this.input[0].selectionEnd === 0)){
                  this.stackedItemListAdapter.removeItemAt(this.stackedItemListAdapter.getCount()-1) ;
               }
            }
            break ;
        case keycodes.DELETE :
            if(this.stackedItemList.getSelectedItemIndex() !== false ) {
               this.stackedItemListAdapter.removeItemAt(this.stackedItemList.getSelectedItemIndex()) ;
               event.preventDefault() ;
            }
            break ;
        case keycodes.ESCAPE :
            this.input.blur() ;
            break ;
        case keycodes.HOME : // no break
        case keycodes.END :
            if(!this.selected) {
                event.preventDefault() ;
            }
            break ;
    }
} ;

SearchEdit.prototype.on = function(events, handler, context) {
    $(this).on(events, $.proxy(handler, context)) ; 
} ;

SearchEdit.prototype.val = function() {
    var val = this.input.val.apply(this.input, arguments);
    this.onInputChanged() ;
    return val ;
} ;

/**
 * Class SearchInput
 * 
 * Widget to handle multi token search with multiple source of suggestion on
 * user keystrokes.
 *
 */

var SearchInput = function(element, suggestionListAdapter, stackedItemAdapter, options){

    this.element = $(element) ;
    this.element.data("SearchInput", this);
    this.element.hide() ;
    
    /* Save options */
    this.options = $.extend({}, SearchInput.defaultOptions, options);
    
    this.buildView(suggestionListAdapter, stackedItemAdapter) ;
    
    this.registerEvents() ;
};

SearchInput.defaultOptions = {
    hint : "Enter a text....",
    /* CSS classes */
    suggestionDropdownStyleClass : "default-suggestion-dropdown",
    hintStyleClass : "default-suggestion-dropdown-hint",
    stackItemClass : "default-stack-item",
    selectedStackItemClass:"default-selected-stack-item",
    stackItemContentStyleClass : "default-stack-item-content",
    stackItemDeleteButtonStyleClass:"default-stack-item-delete-button",
    searchEditInputStyleClass:"default-search-edit-input",
    inputContainerClass: "default-search-item-input-container",
    styleClass: "default-search-input",
    suggestionListStyleClass:"default-suggestion-dropdown-list"
};

SearchInput.prototype.buildView = function(suggestionListAdapter, stackedItemAdapter) {
    /* Create the sub views */
    this.suggestionDropdown = new SuggestionDropdown(
        suggestionListAdapter,
        {
            styleClass : this.options.suggestionDropdownStyleClass,
            hintStyleClass : this.options.hintStyleClass,
            listStyleClass : this.options.suggestionListStyleClass
        }
    ) ;
    this.suggestionDropdown.setHint(this.options.hint) ;
    this.input = new SearchEdit(
            stackedItemAdapter,
            {
                    styleClass : this.options.inputContainerClass,
                    inputStyleClass : this.options.searchEditInputStyleClass,
                    stackItemClass : this.options.stackItemClass,
                    selectedStackItemClass : this.options.selectedStackItemClass,
                    stackItemContentStyleClass : this.options.stackItemContentStyleClass,
                    stackItemDeleteButtonStyleClass : this.options.stackItemDeleteButtonStyleClass
            }
    ) ;
    
    this.view = $("<div/>").addClass(this.options.styleClass) ;
    /* Assemble the views */
    this.view.append(this.input.view) ;
    this.view.append(this.suggestionDropdown.view) ;

    /* Attach the resulting view */
    this.view.insertAfter(this.element) ;
} ;

SearchInput.prototype.registerEvents = function() {
    /* text input events */
    var thisSearchInput = this;
    this.input.on("focus", function() {
        thisSearchInput.suggestionDropdown.show() ;
    }) ;
    this.input.on("blur", function() {
        thisSearchInput.suggestionDropdown.hide() ;
    }) ;
    this.input.on("patternChanged", function(event, pattern) {
        $(thisSearchInput).trigger("patternChanged", [pattern]) ;
        //this.input.select() ; // TODO
        // TODO hilite
    }) ;
    this.input.on("up", function(event) {
        thisSearchInput.suggestionDropdown.getList().selectPreviousItem() ;
    }) ;
    this.input.on("down", function(event) {
        thisSearchInput.suggestionDropdown.getList().selectNextItem() ;
    }) ;
    this.input.on("enter", function(event) {
        thisSearchInput.validateSuggestion() ;
    }) ;
   
    /* Add / Delete in stacked items */
    this.input.stackedItemListAdapter.on("add", function(event, index, item) {
        $(thisSearchInput).trigger("add", [item]) ;
    }) ;
    this.input.stackedItemListAdapter.on("remove", function(event, index, item) {
        $(thisSearchInput).trigger("remove", [item]) ;
    }) ;
    
    /* Click on a suggestion in the suggestion drop down menu */
    this.suggestionDropdown.on("itemClicked", function(event, index, item) {
        thisSearchInput.validateSuggestion() ; // TODO : validate index ?
    }) ;
} ;

SearchInput.prototype.validateSuggestion = function() {
    if(this.suggestionDropdown.getList().getSelectedItem() !== false) {
        this.input.stackedItemListAdapter.addItem(this.suggestionDropdown.getList().getSelectedItem()) ;
        this.input.val("") ;
    }
} ;

SearchInput.prototype.getStackedItem = function() {
    return this.input.stackedItemListAdapter.getItems() ;
} ;

SearchInput.prototype.addSearchItem = function(item) {
     if(this.input.stackedItemListAdapter.addItem(item)) {
         $(this).trigger("add", [item]) ;
     }
} ;

SearchInput.prototype.resetSearchItems = function(items) {
    this.input.stackedItemListAdapter.resetItems(items) ;
    $(this).trigger("reset", [items]) ;
};

SearchInput.prototype.on = function(events, handler, context) {
    $(this).on(events, $.proxy(handler, context)) ; 
} ;
