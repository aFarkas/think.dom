#think.js - The "Think DOM library"


think.js is an extreme lightweight widget factory, which helps you to create smart, self-contained, self-initializing, reusable, descriptive UI widgets / components, without forcing you to use a bunch of polyfills or a specific DOM library.

think.js takes only a few but very exciting and more stable features and ideas of the web components world and turns them into a lightweight, fast, robust/stable micro library. To make it usable today (tested Browser Support: IE9+, Safari 5.1+, Firefox14+, Chrome 18+).

##Install

```html
<script>
// for IE10-, Safari 6.0-
if(!window.MutationObserver){
	document.write('<script src="js/think-polyfills.min.js"><\/script>');
}
</script>
<script src="js/think.min.js"></script>

<script>
think.dom('my-component', {
	/* component definition */
});
</script>
```

The [full documentation for the think API](docs/readme.md).

##How think makes your development easier

###The DOM is alive
CSS and the current way of JavaScript development do not work well together. While a CSS selector applys to any current and future element...

```css
.ui-datepicker {
	/* every element with the class "ui-datepicker"
	looks like a datepicker */
}
```

... a normal DOM query in JS only applys to a specific moment.

```js
/*
every element with the class "ui-datepicker" found at document ready behaves like a datepicker,
BUT every new datepicker element in the document has to be initialized again and again and again....
*/
$(document).ready(function(){
	$('.ui-datepicker').datepicker();
});
```

``think`` on the other hand **works on the living document** and helps writing self-initializing UI objects based on their class name and even helps to turn old-fashioned written JS widgets into live objects:

```js
/* every current and future element with class "ui-datepicker" behaves like a datepicker */
think.dom('ui-datepicker', {
	life: {
		created: function(){
			$(this).datepicker();
		}
	}
});
```

###It's about the DOM element
``think`` doesn't force you to switch your ``this`` context between an element and an abstract widget object. ``think`` puts the DOM element right there, where it belongs and extends the DOM in a save and future proof way **without polluting ``Element.prototype``**.

###HTML configures the behavior
Native elements have the concept of reflecting attributes (HTML attributes vs DOM properties or content attributes vs. IDL attributes) to configure the initial state with a declarative and descriptive API, while this verbose API is seamlessly integrated into the DOM scripting world. ``think`` makes it easy to declare several reflecting attribute types, by automatically generating ES5 ``accessors`` and HTML5 DOM attribute ``MutationObserver``s. Every property is automatically camel-cased and gets a ``x`` prefix and every content attribute a ``data-`` prefix:

```html
<input class="ui-datepicker" data-show-week="" />
```

```js
think.dom('ui-datepicker', {
	life: {
		created: function(){
			$(this).datepicker({
				showWeek: this.xshowWeek
			});
		}
	},
	attrs: {
		'show-week': {
			type: 'boolean'
		}
	}
});
```

Re-act on DOM change:

```js
think.dom('ui-datepicker', {
	life: {
		created: function(){
			$(this).datepicker({
				showWeek: this.xshowWeek
			});
		}
	},
	attrs: {
		'show-week': {
			type: 'boolean',
			onset: function(){
				$(this).datepicker('option', 'showWeek', this.xshowWeek);
			}
		}
	}
});
```

###Re-usable UI components
**Self-contained widgets** are the key to create re-usable and multiple widgets for a website or webapp. ``think`` gives you many tools to stay in the context of the main UI element, while associating different elements in a document with each other.

The following JS:

```js
//create a panel with an open attribute
think.dom('panel', {
	attrs: {
		open: {type: 'boolean'}
	}
});

//create a panel-toggle which is automatically associated to a panel
think.dom('panel-toggle', {
	attrs: {
		target: {
			type: 'node', 
			childOf: '.panel'
	   }
	},
	on: {
		click: function(){
			this.xtarget.xopen = !this.xtarget.xopen;
		}
	}
});

```

Let's you use the following HTML.

```html
<style>
.panel > .panel-box {
	display: none;
}
.panel[data-open] > .panel-box {
	display: block;
}
</style>

<button type="button" class="panel-toggle" data-target="panel-id">
	toggles panel
</button>

<div class="panel" data-open>
	<button type="button" class="panel-toggle">
		Toggle
	</button>
	<div class="panel-box">
		Some content for first panel (initially open)
	</div>
</div>

<div class="panel" id="panel-id">
	<button type="button" class="panel-toggle">
		Toggle
	</button>
	<div class="panel-box">
		Some content for 2 with #id
	</div>
</div>
```

##Similiar Projects/Ideas

* [x-tags](http://x-tags.org/)
* [better-dom](http://chemerisuk.github.io/better-dom/)
* [jquery ui widget factory](http://api.jqueryui.com/jQuery.widget/)
* [Polymer](https://github.com/Polymer/polymer)

##Used third party scripts
All code of the think-polyfills.js is third party code:

* [MutationObservers polyfill](https://github.com/Polymer/MutationObservers/blob/master/LICENSE)
* [weekmap polyfill](https://github.com/Polymer/WeakMap/blob/master/LICENSE)
* [DOM4 polyfill](https://github.com/WebReflection/dom4/blob/master/LICENSE.txt)
