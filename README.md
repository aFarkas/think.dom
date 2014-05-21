#think.js documentation

* ``think.dom`` the component factory - the heart of think
* ``think.event`` event uitils object to add/remove/fire events
* ``think.update`` takes the currently running ``MutationRecords`` and updates/creates all widgets
* ``think.reflectTypes`` extendable object of reflecting attribute types
* ``think.baseWidget`` extendable object, which is mixed into all created widgets

##think.dom(className="", widgetDescription={})

The ``think.dom`` takes two arguments first the class name of your UI widgets and second the widgetDescription, which consists of the following optional sub objects:

* ``live`` (declares the lifecycle object)
* ``on`` (declares the event to bind to the widget element)
* ``attrs`` (declares reflecting attributes for the widget)
* ``proto`` (declares methods and properties for the widget)
* ``props`` (declares setters/getters and values for the widget)
* ``subtreeWidgets`` (declares widgets, which live only inside this parent widget and are bi-directional associated)

###The ``live`` object:

```js
think.dom('my-widget', {
	life: function(){
		created: function(widgetDefinition){
			//this widget was just inserted into the document
		},
		moved: function(){
			//this widget was moved/manipulated in the document
		},
		destroyed: function(widgetDefinition){
			//this widget was removed form the document
		},
		attr: {
			'data-fantastic': function(){
				//this.getAttribute('data-fantastic') was just changed
			}
		},
		subtree: {
			'.my-subwidget-a, .my-subwidget-b': function(changeObj){
				//.my-subwidget-a / .my-subwidget-b was added/removed
				//changeObj.added.length
				//changeObj.removed.length
			}
		}
	}
});
```

###The ``on`` object

```js
think.dom('my-widget', {
	on: {
		click: function(e){
			//my-widget was just clicked
		},
		'mousedown touchstart': function(e){
			//there was a mousedown/touchstart on my widget
		},
		'click:delegate(.option)': function(e, option){
			//an .option element inside my widget (this, e.currentTarget) was just clicked
		}
	}
});
```

###The ``attrs`` object

The ``attrs`` object declares reflecting attributes. The generated ``data-`` attributes can be used to make your widget configurable or as styling hooks for your CSS, while the reflecting ``x`` property does its magic in your JavaScript code. In case the attribute has an ``aria-`` prefix, ``think`` won't generate a ``data-``prefix for it.

####Common attribute definitions

The following code generates reflecting attributes with the property name ``xsource`` and the content attribute name ``data-source`` for the widget.



```js
think.dom('my-widget', {
	attrs: {
		source: {}
	}
});
```

The ``name`` property controls the name of the generated accessors.

```js
think.dom('my-widget', {
	//"xpropSource" reflects "data-source".
	attrs: {
		source: {name: 'propSource'}
	}
});
```

With the ``onset`` callback you can listen to any attribute/property change:

```js
think.dom('my-widget', {
	attrs: {
		source: {
			onset: function(){
				//The "xsource" property / the "data-source" attribute was changed.
				console.log(this.xsource)
			}
		}
	}
});
```

With the ``canceable`` property the developer can mark an attribute change as canceable. In this case a canceable and bubbling event is fired with the name ``beforeyourpropertynamechange``.

```js
think.dom('panel', {
	attrs: {
		'aria-selected': {
			type: 'boolean',
            canceable: true
		}
	}
});

think.dom('panel-wrapper', {
	on: {
    	'beforeselectedchange': function(e){
        	if(e.target.matches('.panel) && **someCondition**){
            	e.preventDefault();
            }
        }
    }
});
```

Due to the fact, that this event is bubbling and you might use multiple differnt widgets with the same property name, you should check, wether the event target matches your widget className.

All reflecting types, but the ``boolean``-type, do support a default value called ``default`` in case the current value is fals-y, this value is returned. How this default value is processed depends on the type of the attribute.

```js
//if the attribute data-foo is not set, it will return "bar"
think.dom('my-widget', {
	attrs: {
    	'foo': {'default': 'bar'}
    }
});
```


####The default attr type


####The nodes attr type

```js
think.dom('my-accordion', {
	attrs: {
		items: {
			type: 'nodes',
            parentOf: '.accordion-items'
		}
	}
});
```







