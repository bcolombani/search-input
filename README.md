# Search Input
> Work in progress !

## Purpose
> TODO
## Usage
See demo.html for usage.

To make it work you will have to implement :
* A suggestion provider : will provide the data suggested to the user
* An item provider : will provide the views to display suggestions in the drop down menu

The **suggestion provider** shall implement the followinf methods :
* getCount : returns the current suggestion count
* getView(index) : returns a DOM element that will be used to display the suggestion at a given index
* getItem(index) : returns the object related to the given index
* selectItem(index, view) : called to inform the given index is now selected, may be used to highlite the suggestion, or keep track of the selected object. view parameter is the previously provided view (through getView(index))
* unselect(index, view) : when the item is deselected
* releaseView(view) : called when the view will not be used anymore, should be used for clean up
* on(event) : is called by the search input to register to the following event which may be triggered by the adapter :
 * trigger("add", itemIndex) : to insert a new item at a given index
 * trigger("remove", itemIndex) : to remove the item at a given index
 * trigger("reset") : to remove all items from the suggestion list

The **item provider** is used to provide the labels stacked to the left of the search input to accumulate suggestions. The item provider shall implement the following method :
* getView(data, index) : shall return a DOM element that represents the item
Note that the element is wrapped inside another element.
* equals(data1, data2) : implement to prevent an element to be selected twice

The search input will trigger the following events (register with 'on' method) :
* remove : when a selected item is removed
* add : when a new item is selected
* reset : when all the selected elements a removed
* patternChanged : when user input has changed (suggestions may be updated)

The search input exposes the followind additional method :
* addSearchItem(newItem) : to manually add an item in the selected item list
* resetSearchItems : to manually empty the selected item list

## License

MIT © [bcolombani]()

