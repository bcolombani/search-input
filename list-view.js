/* Listview adpater prototype and events:
ListAdapter.prototype = {
    getView : function(itemIndex) {},
    getItem : function(itemIndex) {},
    getCount : function() {},
    selectItem : function(itemIndex, view) {},
    unselect : function(itemIndex, view) {},
    releaseView : function(view) {},
    on : function(event, handler, context) {},
Events :
    trigger("add", [itemIndex]) ;
    trigger("remove", [itemIndex]) ;
    trigger("reset", []) ;
} ;
*/

var ListView = function(adapter, options) {
    this.options = $.extend({}, ListView.defaultOptions, options) ;
    
    if(options.el) {
        this.view = options.el ;
    } else {
        this.view = $("<div>").addClass(this.options.styleClass) ;
    }
    this.selectedItemIndex = false ;
    this.adapter = adapter ;
    this.adapter.on("reset", this.render, this) ;
    this.adapter.on("add", function(event, itemIndex) {
        this.addItem(itemIndex) ;
    }, this) ;
    this.adapter.on("remove", function(event, itemIndex) {
        this.removeItem(itemIndex) ;
    }, this) ;
    this.render() ;
};

ListView.defaultOptions = {
    styleClass : "default-list-view",
    blockBegin : false,
    blockEnd : false,
    selectOnHover : true,
    selectOnClick : true,
    selectFirstOnChange : false,
    el : false,
    elementWhenEmpty : false
};

ListView.prototype.render = function() {
    this.releaseAllViews() ;
    
    this.view.children().detach() ;
    this.selectedItemIndex = false ;
    
    for(var itemIndex = 0 ; itemIndex < this.adapter.getCount(); itemIndex++) {
        this.view.append(this.adapter.getView(itemIndex)) ;
    }
    this.registerAllEvents() ;
    
    if(this.options.selectFirstOnChange && this.adapter.getCount()) {
        this.selectItem(0) ;
    } else if(this.options.elementWhenEmpty !== false && this.adapter.getCount() === 0) {
        this.view.append(this.options.elementWhenEmpty) ;
    }
};

ListView.prototype.unregisterAllEvents = function() {
    this.view.children().off(".ListView") ;
};

ListView.prototype.unregisterEvents = function(itemView) {
    itemView.off(".ListView") ;
};

ListView.prototype.registerAllEvents = function() {
    var thisListView = this;
    this.view.children().each(function(itemIndex, itemView) {
        thisListView.registerEvents($(itemView)) ;
    }) ;
};

ListView.prototype.registerEvents = function(itemView) {
    var thisListView = this;
    itemView.on("mousedown.ListView", function(event) {
        var viewIndex = thisListView.view.children().index(this);
        thisListView.onItemClicked(viewIndex) ;
        if(thisListView.options.selectOnClick) {
            thisListView.selectItem(viewIndex) ;
        }
        event.preventDefault() ;
    }) ;
    if(thisListView.options.selectOnHover) {
        itemView.on("mouseenter.ListView", function() { 
            var viewIndex = thisListView.view.children().index(this);
            thisListView.selectItem(viewIndex) ;
        }) ;
    }
};

ListView.prototype.onItemClicked = function(itemIndex) {
    $(this).trigger("itemClicked", [itemIndex, this.adapter.getItem(itemIndex)]) ;
};

ListView.prototype.addItem = function(itemIndex) {
    if(this.options.elementWhenEmpty !== false)
        this.options.elementWhenEmpty.detach() ;
    
    var newView = this.adapter.getView(itemIndex);
    var previousView = this.view.children().eq(itemIndex);
    if(previousView.length) {
        newView.insertBefore(previousView) ;
    } else {
        this.view.append(newView) ;
    }
    this.registerEvents(newView) ;
    
    if(this.selectedItemIndex !== false) {
        if(itemIndex <= this.selectedItemIndex) {
            this.selectedItemIndex++ ;
        }
    }
    
    if(this.options.selectFirstOnChange)
        this.selectItem(0) ;
};

ListView.prototype.removeItem = function(itemIndex) {
    var oldView = this.view.children().eq(itemIndex);
    
    if(oldView.length) {
        this.releaseView(oldView) ;

        if(this.selectedItemIndex !== false) {
            if(this.adapter.getCount()) {
                if(this.selectedItemIndex === itemIndex) {
                    this.selectItem(itemIndex) ;
                } else if(this.selectedItemIndex > itemIndex) {
                    this.selectedItemIndex-- ;
                }
            } else {
                this.selectedItemIndex = false ;
            }
        }
    }
    
    if(this.options.selectFirstOnChange) {
        this.selectItem(0) ;
    }
    if(this.adapter.getCount() === 0 && this.options.elementWhenEmpty !== false) {
        this.view.append(this.options.elementWhenEmpty) ;
    }
};

ListView.prototype.releaseAllViews = function() {
    var thisListView = this;
    this.view.children().each(function(itemIndex, itemView) {
        thisListView.releaseView($(itemView)) ;
    }) ;
};

ListView.prototype.releaseView = function(itemView) {
    itemView.detach() ;
    itemView.off(".ListView") ;
    this.adapter.releaseView(itemView) ;
};

ListView.prototype.selectItem = function(itemIndex) {
    var selected = false;
    var itemView = this.view.children().eq(itemIndex);
    if(itemView.length) {
        this.unselectItem() ;
        this.selectedItemIndex = itemIndex ;
        this.adapter.selectItem(itemIndex, itemView) ;
        selected = true ;
    }
    
    return selected ;
};

ListView.prototype.unselectItem = function() {
    if(this.selectedItemIndex !== false) {
        var itemView = this.view.children().eq(this.selectedItemIndex);
        if(itemView.length) {
            this.adapter.unselect(this.selectedItemIndex, itemView) ;
            this.selectedItemIndex = false ;
        }
    }
};

ListView.prototype.selectNextItem = function() {

    if( this.selectedItemIndex === false ) {
        this.selectItem(0) ;
    } else if(this.selectedItemIndex === (this.adapter.getCount()-1) ) {
        if(!this.options.blockEnd) {
            this.unselectItem() ;
        }
    } else {
        this.selectItem(this.selectedItemIndex+1) ; 
    }
    
    return this.selectedItemIndex ;
};

ListView.prototype.selectPreviousItem = function() {

    if(this.selectedItemIndex === false) {
        this.selectItem(this.adapter.getCount()-1) ;
    } else if(this.selectedItemIndex === 0) {
        if(!this.options.blockBegin) {
            this.unselectItem() ;
        }
    } else {
        this.selectItem(this.selectedItemIndex-1) ;
    }
    
    return this.selectedItemIndex ;
};

ListView.prototype.getSelectedItem = function() {
    var item = false;
    
    if(this.selectedItemIndex !== false) {
        item = this.adapter.getItem(this.selectedItemIndex) ;
    }
    
    return item ;
};

ListView.prototype.getSelectedItemIndex = function() {
    return this.selectedItemIndex ;
};

ListView.prototype.on = function(events, handler, context) {
    $(this).on(events, $.proxy(handler, context)) ; 
} ;
