#think.js documentation

* ``think.dom`` the component / widget factory - the heart of think
* ``think.event`` event uitils object to add/remove/fire events
* ``think.addAttributeType`` extend the list of reflecting attribute types
* ``think.baseWidget`` extendable object, which is mixed into all created widgets
* ``think.update`` takes the currently running ``MutationRecords`` and updates/creates all widgets

##think.dom(className="", widgetDescription={})

The ``think.dom`` takes two arguments first the class name of your UI widget and second the widgetDescription, which consists of the following optional sub objects:

* ``live`` (declares the lifecycle object)
* ``on`` (declares the event to bind to the widget element)
* ``attrs`` (declares reflecting attributes for the widget)
* ``props`` (declares setters/getters and values for the widget)
* ``proto`` (declares methods and properties for the widget)

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

The ``attrs`` object declares reflecting attributes. The generated ``data-`` attributes can be used to make your widget configurable or as styling hooks for your CSS, while the reflecting ``x`` property does its magic in your JavaScript code.

Additionally ``think`` will provide the developer with some predefined attribute types and options to create a powerfull consistent API by just configuring some attributes and mixing them together.

The following code generates reflecting attributes with the property name ``xsource`` and the content attribute name ``data-source`` for the widget.

```js
think.dom('my-widget', {
	attrs: {
		source: {}
	}
});
```

In case the attribute uses an ``aria-`` prefix, ``think`` won't add a ``data-`` prefix:

```js
think.dom('my-widget', {
	//'aria-checked' is reflected by xchecked
	attrs: {
		'aria-checked': {type: 'boolean'}
	}
});
```

####Common attribute definitions
There are some attribute options, which are common to all attribute types:

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

All reflecting attribute types do support a default value called ``default`` in case the current value is fals-y. How this default value is processed depends on the type of the attribute.

```js
think.dom('my-widget', {
	attrs: {
		foo: {
			'default': 'bar'
		}
	}
});
```


If the ``fire`` option is set to ``true`` a property/attribute change will automatically fire a simple bubbling DOM event with the name ``yourpropertynamechange`` on the target element after the attribute was changed.


```js
think.dom('my-widget', {
	//aria-checked is reflected by xchecked
	attrs: {
		'aria-checked': {
			type: 'boolean',
			fire: true
		}
	}
});

//can be used like this:
think.event.on(document, 'checkedchange', function(e){
	if(e.target.matches('.my-widget')){
		//my-widget was checked or unchecked
	}
});
```

If the ``cancelable`` option is set to ``true``. Think will fire a simple canceable bubbling DOM event with the name ``beforeyourpropertynamechange`` on the target element, before the attribute is changed. If the event is prevented, think won't change the attribute and won't call the ``onset`` callback.


```js
think.dom('my-widget', {
	//aria-checked is reflected by xchecked
	attrs: {
		'aria-checked': {
			type: 'boolean',
			cancelable: true
		}
	}
});

//can be used like this:
think.event.on(document, 'beforecheckedchange', function(e){
	//prevent checkedchange on **somecondition**
	if(e.target.matches('.my-widget') && **somecondition**){
		e.preventDefault();
	}
});
```

####The ``default`` attr type
If no type is specified the the default setters and getters will be added. Mainly if the attribute is undefined, the getter will return an empty string.

####The ``enum`` attr type

The ``enum`` attribute type creates enumarated attributes. If the set value does not match the list of the ``enums`` option, the ``default`` option is used:

```js
think.dom('my-widget', {
	attrs: {
		'preload': {
			type: 'enum',
			enums: ['auto', 'none', 'metadata'],
			'default': 'auto'
		}
	}
});
```
####The ``json`` attr type

The ``json`` can be used to set/get plain objects for data storing.
```js
think.dom('my-widget', {
	attrs: {
		//reflects 'data-data' to xdata
		'data': {
			type: 'json'
		}
	}
});
```

####The ``node`` and ``nodes`` attr types

The ``node`` and ``nodes`` attr types can be used to associate multiple elements with each other. Both have a bunch of options and are very similiar. While the ``node`` type returns a DOM element or ``null`` the ``nodes`` will always return an array of DOM elements.

The most basic usage of type ``node`` would look like this and declares an explicit referencing of another element by ``id``.

```js
think.dom('label', {
	attrs: {
		'aria-controls': {
			type: 'node'
		}
	}
});
```

```html
<!-- label.xcontrol is associated with #check, because the aria-controls attribute value refers to the id of the element -->
<span id="check"></span>
<span class="label" aria-controls="check">some label text</span>
```

The code above can be extended by using the ``parentOf`` option:

```js
think.dom('label', {
	attrs: {
		'aria-controls': {
			type: 'node',
			parentOf: '.checkbox, .radio'
		}
	}
});
```

```html
<!-- label.xcontrol is associated with .checkbox, because the element is a parent of '.checkbox, .radio' -->
<span class="label">
	<span class="checkbox"></span>
	some label text
</span>

<!-- label.xcontrol is associated with .checkbox, because the aria-controls attribute value refers to the id of the .checkbox -->
<span class="checkbox" id="check"></span>
<span class="label" aria-controls="check">some label text</span>
```

The above connection can be made bi-directional by creating a "checkbox" widget and using the ``nodes`` type in conjunction with the ``childOf`` and ``idAsValueOf`` options:


```js
think.dom('checkbox', {
	attrs: {
		'labels': {
			type: 'nodes',
			childOf: '.label',
			idAsValueOf: 'aria-controls'
		}
	}
});
```

Multiple elements can also be grouped by using the ``sameValue`` option. With the following code all .radio elements with the same value for the attribute "data-name" are associated using the 'xgroup' property:

```js
think.dom('radio', {
	attrs: {
		'name': {
			type: 'nodes',
			name: 'group',
			sameValue: true
		}
	}
});
```

Here is a [simple example](../examples/form-label-control.html) using the above configurations to define element associations between custom/pseudo form controls.

Another powerfull way to associate elements is by index inside a given container. (The first button.toggle-panel is associated with the first .panel inside a container called .panel-group):

```js
think.dom('toggle-panel', {
	attrs: {
		'aria-controls': {
			type: 'node',
			name: 'panel',
			indexOf: '.panel'
		}
	}
});
```

```html
<div class="panel-group">
	<button class="toggle-panel">toggle panel 1</button>
	<button class="toggle-panel">toggle panel 2</button>
	<div class="panel">Panel content 1</div>
	<div class="panel">Panel content 2</div>
	<button class="toggle-panel">toggle panel 3</button>
	<div class="panel">Panel content 3</div>
</div>
```

``think`` uses some heuristics to detect the right container automatically, but sometimes its wise to declare the "grouping" container explicit:


```js
think.dom('toggle-panel', {
	attrs: {
		'aria-controls': {
			type: 'node',
			name: 'panel',
			indexOf: '.panel',
			indexPartent: '.panel-group'
		}
	}
});
```

Due to the fact, that we want to be able to associate multiple .toggle-button elements with one group we can additionally specify ``indexSelf`` selector, which will remove all .toggle-button elements, which do not match this filter:

```js
think.dom('toggle-panel', {
	attrs: {
		'aria-controls': {
			type: 'node',
			name: 'panel',
			indexOf: '.panel',
			indexPartent: '.panel-group',
			indexSelf: '.toggle-index'
		}
	}
});
```

The code above let us use the following markup:

```html
<div class="panel-group">
	<button class="toggle-panel toggle-index">toggle panel 1</button>
	<button class="toggle-panel toggle-index">toggle panel 2</button>
	<div class="panel">
		Panel content 1
		<!-- excluded from index -->
		<button class="toggle-panel" aria-controls="panel2">toggle panel 2</button>
	</div>
	<div class="panel" id="panel2">Panel content 2</div>
	<button class="toggle-panel toggle-index">toggle panel 3</button>
	<div class="panel">Panel content 3</div>
</div>
```

Assocation of a .panel to its .toggle-panel elements would look like this:

```js
think.dom('.panel', {
	attrs: {
		'buttons': {
			type: 'nodes',
			idAsValueOf: 'aria-controls',
			//we don't need indexSelf here!
			indexOf: '.toggle-button.toggle-index',
			indexPartent: '.panel-group'
		}
	}
});
```

Here is a [configuration example using the ``indexOf``/``indexParent``](tutorial/examples/5-example.html) configuration option and using the ``fire`` and ``canceable`` option to build first collapsible panels and extend those by grouping them into tabs/accordion control.

###The ``props`` object:

```js
think.dom('.panel-group', {
	props: {
		selectedItem: {
			get: function(){
				return this.querySelector('[aria-expanded="true"].panel');
			},
			set: function(panel){
				panel.xexpanded = true;
			}
		},
		selectedIndex: {
			get: function(){
				return this.xpanels.indexOf(this.xselectedItem);
			},
			set: function(index){
				var panel = this.xpanels[index];
				if(panel){
					panel.xexpanded = true;
				}
			}
		}
	}
});
```

###The ``proto`` object:

```js
think.dom('.panel-group', {
	proto: {
		selectNext: function(){
			var next = this.xselectedIndex + 1;
			if(next >= this.xlength){
				next = 0;
			}
			this.xselectedIndex = next;
		}
	}
});
```

##The ``think.addAttributeType(typeName, descriptor)`` method

``think.addAttributeType`` helps you to add new reflecting attribute types. In case you want to create a new attribute type called ``date``your code could look like this:


```js
think.addAttributeType('date', {
	get: function(attrName, contentValue, options){
		var ret = null;
		if(contentValue){
			ret = new Date(contentValue);
		}
		return ret;
	},
	set: function(attrName, value, options){
		if(value && value.getTime){
			value = value.toJSON();
		}
		this.setAttribute(value);
	}
});
```








