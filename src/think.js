(function(document, undefined){
    "use strict";
    var isReady;
    var docElem = document.documentElement;
    var thinkid = 'think' + (Date.now());
    var uuid = 0;
    var elemProto = Element.prototype;
    var think = {};
    var slice = Array.prototype.slice;
    var STRING = 'string';
    var cache = (function(){
        var fns = [];
        return {
            c: function(){
                while(fns.length){
                    fns.shift()();
                }
            },
            a: function(dom, propName, attrValue, cacheValue, isDom){
                var cache = elementData(dom)._.cache;
                attrValue += '';
                if(!cache[propName]){
                    cache[propName] = {};
                }
                cache[propName][attrValue] = cacheValue;
                if(isDom && cacheValue){
                    fns.push(function(){
                        if(attrValue in cache[propName]){
                            delete cache[propName][attrValue];
                        }
                    });
                }
                return cacheValue;
            },
            g: function(dom, propName, attrValue){
                var cache = elementData(dom)._.cache;
                attrValue += '';
                return cache[propName] && cache[propName][attrValue];
            }
        };
    })();

    var queue = (function(){
        var fns = [];
        return {
            a: function(fn){
                fns.push(fn);
            },
            d: function(){
                if(queue.b){return;}
                while(fns.length){
                    fns.shift()();
                }
            }
        }
    })();
    var mapId = function(id){
        return '#'+id;
    };
    var reflectTypes = {

    };
    var regDash = /-(.)/g;
    var regAria = /^aria\-/;
    var baseWidget = {};


    [{name: 'xclosest', fn: 'matches'}, {name: 'xclosestContainer', fn: 'querySelector'}].forEach(function(desc){
        baseWidget[desc.name] = function(sel, elem, stop){
            elem = elem || this;
            var node = cache.g(elem, desc.name, sel);
            if(node !== undefined){
                return node;
            }
            node = elem;
            while(node && node[desc.fn] && !node[desc.fn](sel)){
                node = node.parentNode;
                if(node == stop){
                    node = null;
                }
            }
            return cache.a(elem, desc.name, sel, node && node.nodeType == 1 ? node : null, 1);
        };
    });

    ['querySelector', 'querySelectorAll'].forEach(function(fn){
        var toArray = fn == 'querySelectorAll';
        baseWidget['x'+fn] = function(sel, dom){
            if(!dom){
                dom = this;
            }
            var ret = cache.g(dom, fn, sel);
            if(ret !== undefined){ret;}
            ret = dom[fn](sel);
            if(toArray){
                ret = slice.call(ret);
            }
            return cache.a(dom, fn, sel, ret, 1);
        };

    });

    ['attr', 'subtree'].forEach(function(name){
        baseWidget['xupdate'+name] = function(){
            var observer = elementData(this)._.observers[name];
            if(observer){
                observer.take();
            }
        };

    });


    if(!elemProto.matches){
        elemProto.matches = elemProto.mozMatchesSelector || elemProto.webkitMatchesSelector || elemProto.msMatchesSelector;
    }

    function defSet(name, value, options){
        if(value == null){
            this.removeAttribute(name);
        } else {
            this.setAttribute(name, value);
        }
    }

    function defGet(name, value, options){
        return value || ('default' in options ? options['default'] : '');
    }

    function addAttributeType(type, desc){
        reflectTypes[type] = desc;
        if(!desc.set){
            desc.set = defSet;
        }
        if(!desc.get){
            desc.get = defGet;
        }
    }

    addAttributeType('', {});

    addAttributeType('boolean', {
        get: function(name, value, options){
            return options.isAria ?
                value == 'true' :
                value != null
            ;
        },
        set: function(name, value, options){
            value = !!value;
            if(options.isAria){
                this.setAttribute(name, value);
            } else {
                this.removeAttribute(name);
            }
        }
    });

    addAttributeType('enum', {
        get: function(name, value, options){
            return options.enums.indexOf(value) != -1 ? value : options['default'] || '';
        }
    });

    addAttributeType('node', {
        get: function(name, value, options){
            var useValue, parent, index;
            var elem = cache.g(this, name, value);
            if(elem){return elem;}
            if(value){
                elem = document.getElementById(value);
            }

            if(!elem && options.indexOf){
                useValue = typeof options.indexOf != STRING ? value : options.indexOf;
                parent = options.indexParent ? this.xclosest(options.indexParent) : this.xclosestContainer(useValue, this.parent);
                if(parent){
                    index = slice.call(this.xquerySelectorAll((options.indexSelf || '') + '.'+options.widgetName, parent)).indexOf(this);
                    elem = this.xquerySelectorAll(useValue, parent)[index];
                }
            }
            if(!elem && options.childOf){
                useValue = typeof options.childOf != STRING ? value : options.childOf;
                elem = this.xclosest(useValue);
            }
            if(!elem && options.parentOf){
                useValue = typeof options.parentOf != STRING ? value : options.parentOf;
                elem = this.querySelector(useValue);
            }

            return cache.a(this, name, value, elem || null, 1);
        },
        set: function(name, value, options){
            if(value){
                if(typeof value != 'string'){
                    value = value.id;
                    if(!value){
                        uuid++;
                        value.id = 'id-'+uuid;
                        value = value.id;
                    }
                }
                this.setAttribute(name, value);
            } else {
                this.removeAttribute(name);
            }
        }
    });

    addAttributeType('nodes', {
        get: function(name, value, options){
            var useValue, id, elem, index, parent, filter;
            var list = cache.g(this, name, value);

            if(list){
                return list;
            }

            filter = 'filter' in options ? options.filter : options.parentOf || options.childOf || '';
            list = [];

            if(options.sameValue){
                merge(list, this.xquerySelectorAll('['+name+'="'+ value +'"]'+(filter || '.'+options.widgetName), docElem));
            } else if(value){
                merge(list, this.xquerySelectorAll(value.split(' ').map(mapId).join(' '), docElem));
            }

            if(options.parentOf){
                useValue = typeof options.parentOf != STRING ? value : options.parentOf;
                useValue = this.xquerySelectorAll(useValue);

                if(options.idAsValueOf){
                    id = this.id;
                    useValue = useValue.filter(function(elem){
                        var ref = elem.getAttribute(options.idAsValueOf);
                        return !ref || ref == id;
                    });
                }

                merge(list, useValue);
            }
            if(options.childOf){
                useValue = typeof options.childOf != STRING ? value : options.childOf;
                if((elem = this.xclosest(useValue))){
                    list.push(elem);
                }
            }
            if(options.idAsValueOf && (id || (id = this.id))){
                useValue = typeof options.idAsValueOf != STRING ? value : options.idAsValueOf;
                merge(list, this.xquerySelectorAll('[' +useValue+ '="'+ id +'"]'+filter, docElem))
            }

            if(options.indexOf){
                useValue = typeof options.indexOf != STRING ? value : options.indexOf;
                parent = options.indexParent ? this.xclosest(options.indexParent) : this.xclosestContainer(useValue, this.parent);

                if(parent){
                    index = slice.call(this.xquerySelectorAll((options.indexSelf || '') + '.'+options.widgetName, parent)).indexOf(this);
                    if((elem = this.xquerySelectorAll(useValue, parent)[index])){
                        list.push(elem);
                    }
                }

            }

            return cache.a(this, name, value, list, 1);
        }
    });


    addAttributeType('json', {
        get: function(name, value, options){
            var json = cache.g(this, name, value);
            if(json){return json;}
            if(value){
                try {
                    json = JSON.parse(this.getAttribute(name));
                } catch(e){}
            }

            return cache.a(this, name, value, json || options['default'] || null);
        },
        set: function(name, value, options){
            if(typeof value == 'object'){
                value = JSON.stringify(this.getAttribute(name));
            }
            this.setAttribute(name, value);
        }
    });


    function camelCase(match, found) {
        return found.toUpperCase();
    }

    function elementData(elem, key, value){
        var obj;

        if(!elem[thinkid]){
            Object.defineProperty(elem, thinkid, {
                value: {_: {observers: {}, cache: {}, created: {}, widgets: {}}},
                enumerable: !!think.debug,
                writable: true,
                configurable: true
            });
        }

        obj = elem[thinkid];
        if(value === undefined){
            value = key ? obj[key] : obj;
        } else {
            obj[key] = value;
        }
        return value;
    }


    function mixin(a, b){
        var prop;
        for(prop in b){
            if(Array.isArray(b) && Array.isArray(a)){
                merge(a, b);
            } else {
                a[prop] = b[prop];
            }
        }
        return a;
    }


    function merge(a, b){
        var i;
        for(i = 0; i < b.length; i++){
            a.push(b[i]);
        }
    }

    function toArray(obj){
        for(var prop in obj){
            if(!Array.isArray(obj[prop])){
                obj[prop] = [obj[prop]];
            }
        }
    }

    function addAttrObserver(dom, attrs){
        var on, keys;
        var observers = elementData(dom)._.observers;
        var attr = observers.attr;
        toArray(attrs);

        if(attr){
            attr.observer.disconnect();
            mixin(attr.fns, attrs);
        } else {
            observers.attr = {};
            attr = observers.attr;
            attr.fns = attrs;

            on = function(mutations){
                cache.c();
                mutations.forEach(function (mutation) {
                    (attr.fns[mutation.attributeName] || []).forEach(function(fn){
                        fn.call(dom);
                    });
                });
            };
            attr.observer = new MutationObserver(on);
            attr.take = function(){
                var records = attr.observer.takeRecords();
                if(records.length){
                    on(records);
                }
            };
        }
        keys = Object.keys(attr.fns);

        if(keys.length){
            attr.observer.observe(dom, {attributes: true, attributeFilter: keys});
        }
    }

    function searchInNodes(changedNodes, sel, contains){
        var nodeI, nodeLen, foundNodes, foundI, foundLen;
        var foundReturn = [];
        for(nodeI = 0, nodeLen = changedNodes.length; nodeI < nodeLen; nodeI++){
            if(changedNodes[nodeI].nodeType != 1 || docElem.contains(changedNodes[nodeI]) != contains){continue;}
            if(changedNodes[nodeI].matches(sel)){
                foundReturn.push(changedNodes[nodeI]);
            }
            foundNodes = changedNodes[nodeI].querySelectorAll(sel);
            for(foundI = 0, foundLen = foundNodes.length; foundI < foundLen; foundI++){
                if(docElem.contains(foundNodes[foundI]) == contains){
                    foundReturn.push(foundNodes[foundI]);
                }
            }
        }
        return foundReturn;
    }

    function addSubtreeObserver(dom, sel){
        var on;
        var observers = elementData(dom)._.observers;
        var subtree = observers.subtree;

        toArray(sel);

        if(subtree){
            mixin(subtree.fns, sel);
        } else {
            observers.subtree = {};
            subtree = observers.subtree;
            subtree.fns = sel;
            on = function (mutations) {
                var mutation, mutationI, fnI, subtreeObj, dequeue;
                var mutationsLen = mutations.length;
                cache.c();
                if(!queue.b){
                    dequeue = true;
                    queue.b = true;
                }
                for(var sel in subtree.fns){
                    subtreeObj = {
                        added: [],
                        removed: []
                    };
                    for(mutationI = 0; mutationI < mutationsLen; mutationI++){
                        mutation = mutations[mutationI];
                        merge(subtreeObj.added, searchInNodes(mutation.addedNodes, sel, true));
                        merge(subtreeObj.removed, searchInNodes(mutation.removedNodes, sel, false));
                    }
                    if(subtreeObj.added.length || subtreeObj.removed.length){
                        for(fnI = 0; fnI < subtree.fns[sel].length; fnI++){
                            subtree.fns[sel][fnI](subtreeObj);
                        }
                    }
                }
                if(dequeue){
                    queue.b = false;
                    queue.d();
                }
            };

            subtree.observer = new MutationObserver(on);
            subtree.take = function(){
                var records = subtree.observer.takeRecords();
                if(records.length){
                    on(records);
                }
            };
            subtree.observer.observe(dom, {childList: true, subtree: true});
        }
    }

    var onReady = (function(){
        var fns = [];
        var regReady = /^loade|^i|^c/;
        document.addEventListener('DOMContentLoaded', function(){
            queue.b = true;
            while(fns.length){
                fns.shift()();
            }
            queue.b = false;
            queue.d();
        });
        return function onReady(fn){
            if(isReady || regReady.test(document.readyState)){
                isReady = true;
                fn();
                if(window.setImmediate){
                    setImmediate(queue.d);
                }
                setTimeout(queue.d);
            } else {
                fns.push(fn);
            }
        };
    })();


    function addQuery(sel, life, dom){
        if(!dom){
            dom = docElem;
        }
        var obj = {};
        obj[sel] = function(obj){

            obj.added.forEach(function(added){
                var data = elementData(added)._;

                if(data.created[sel]){
                    if(life.moved){
                        life.moved.call(added);
                    }
                } else {
                    data.created[sel] = sel;
                    if(life.created){
                        life.created.call(added);
                    }
                }
            });

            obj.removed.forEach(function(removed){
                var data = elementData(removed)._;
                if(life.destroyed){
                    life.destroyed.call(removed);
                }
                if(data.created[sel]){
                    delete data.created[sel];
                }


            });

        };

        onReady(function(){
            obj[sel]({added: searchInNodes([dom], sel, true), removed: []});
            addSubtreeObserver(dom, obj);
        }, true);
    }

    function createWidget(dom, widget){
        var ext;
        var widgets = elementData(dom)._.widgets;

        if(!widgets[widget.name]){
            if(widget.props){
                Object.defineProperties(dom, widget.props);
            }

            if(widget.proto){
                mixin(dom, widget.proto);
            }

            if(widget.xattrs){
                addAttrObserver(dom, widget.xattrs);
            }
            if(widget.subtree){
                addSubtreeObserver(dom, widget.subtree);
            }

            for(ext in think.exts){
                if(widget[ext]){
                    think.exts[ext](dom, widget[ext]);
                }
            }
        }

        if(widget.life.created){
            queue.a(function(){
                widget.life.created.call(dom, widget);
            });
        }

        widgets[widget.name] = true;
    }

    function getAttrAccessor(attrName, attrOptions){

        return {
            get: function(){
                return reflectTypes[attrOptions.type].get.call(this, attrName, this.getAttribute(attrName), attrOptions);
            },
            set: function(value){
                if(!attrOptions.cancelable || !think.event.fire(this, 'before'+attrOptions.name+'change', {cancelable: true}).defaultPrevented){

                    reflectTypes[attrOptions.type].set.call(this, attrName, value, attrOptions);

                    if(attrOptions.onset){
                        baseWidget.xupdateattr.call(this);
                    }
                    if(attrOptions.fire){
                        think.event.fire(this, attrOptions.name+'change');
                    }
                }

            }
        };
    }

    function buildAttrs(widget){
        var name, attrOptions, attrName;

        if(widget.attrs){
            widget.xattrs = {};
            for(name in widget.attrs){
                attrOptions = widget.attrs[name];
                attrOptions.widgetName = widget.name;

                if(regAria.test(name)){
                    attrOptions.isAria = true;
                    attrName = name;
                } else {
                    attrName = 'data-'+name;
                }
                if(attrOptions.onset){
                    widget.xattrs[attrName] = attrOptions.onset;
                }
                attrOptions.name = (attrOptions.name || name.replace(regAria, '').replace(regDash, camelCase));
                if(!reflectTypes[attrOptions.type]){
                    throw('no reflectType '+attrOptions.type);
                }

                widget.props[attrOptions.name] = getAttrAccessor(attrName, attrOptions);

            }
        }
    }

    function prepareWidget(name, widget){



        widget.name = name;

        if(!widget.life){
            widget.life = {};
        }

        widget.think = {
            created: function(){
                createWidget(this, widget);
            }
        };

        if(widget.life.destroyed){
            widget.think.destroyed = function(){
                widget.life.destroyed.call(this, widget);
            };
        }


        if(widget.life.moved){
            widget.think.moved = widget.life.moved;
        }

        if(!widget.props){
            widget.props = {};
        }

        buildAttrs(widget);


        if(widget.props){
            for(name in widget.props){
                widget.props['x'+name] = widget.props[name];
                delete widget.props[name];
                name = 'x'+name;

                ['configurable', 'enumerable'].forEach(function(cfg){
                    if(!(cfg in widget.props[name])){
                        widget.props[name][cfg] = true;
                    }
                });
            }
        }

        if(widget.proto || widget.props){
            if(!widget.proto){widget.proto = {};}
            for(name in widget.proto){
                widget.proto['x'+name] = widget.proto[name];
                delete widget.proto[name];
            }
            for(name in baseWidget){
                if(!widget.proto[name]){
                    widget.proto[name] = baseWidget[name];
                }
            }
        }
    }

    think.exts = {};
    (function(){
        var closest = baseWidget.xclosest;;
        var regDel = /\s*\:delegate\((.+)\)/;
        function parseOn (evt){
            var match = evt.match(regDel);
            if(match){
                return [evt.replace(match[0], ''), match[1]]
            }
            return [evt];
        }

        think.event = {
            on: function (dom, types, fn, sel){
                var delFn = fn;
                if(sel){
                    if(!fn._delegateFn){
                        fn._delegateFn = {};
                    }
                    if(!fn._delegateFn[sel]){
                        fn._delegateFn[sel] = function(e){
                            var elem = closest(sel, e.target, dom);
                            if(elem){
                                return fn.call(this, e, elem);
                            }
                        };
                    }
                    delFn = fn._delegateFn[sel];
                }
                types.split(' ').forEach(function(type){
                    dom.addEventListener(type, delFn);
                });
            },
            off: function (dom, types, fn, sel){
                if(sel && fn._delegateFn && typeof fn._delegateFn[sel] == 'function'){
                    fn = fn._delegateFn[sel];
                }
                types.split(' ').forEach(function(type){
                    dom.removeEventListener(type, fn);
                });
            },
            fire: function(dom, type, opts){
                opts = mixin({bubbles: true}, opts);

                var evt = new CustomEvent(type, opts);
                dom.dispatchEvent(evt);
                return evt;
            }
        };

        ['on', 'off'].forEach(function(name){
            think.exts[name] = function(dom, events){
                var parsedEvent;
                for(var event in events){
                    parsedEvent = parseOn(event);
                    think.event[name](dom, parsedEvent[0], events[event], parsedEvent[1]);
                }
            };
        });

    })();

    function extend(base){
        slice.call(arguments, 1).forEach(function(source){
            for(var prop in source){
                if( !base[prop] || typeof base[prop] != 'object' ){
                    base[prop] = source[prop] && typeof source[prop] == 'object' ? extend({}, source[prop]) : source[prop];
                } else if(Array.isArray(base[prop]) && 'length' in source[prop]){
                    merge(base[prop], source[prop]);
                } else {
                    extend(base[prop], source[prop]);
                }
            }
        });
        return base;
    }

    think.extend = extend;

    think.baseWidget = baseWidget;

    think.mixin = mixin;

    think.getTypes = function(){
        return Object.keys(reflectTypes);
    };

    think.addAttributeType = addAttributeType;

    think.addAttrObserver = addAttrObserver;
    think.addTreeObserver = addSubtreeObserver;

    think.dom = function(name, widget){
        prepareWidget(name, widget);
        addQuery('.'+name, widget.think);
    };
    think.update = function(){
        var observer = elementData(docElem)._.observers.subtree;
        if(observer){
            observer.take();
        }
    };
    think.widget = think.dom;
    window.think = think;
})(document);
