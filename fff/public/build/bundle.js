
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.44.2' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const feedStore = writable({
        amount: 5,
        refresh: 8,
        active: true
    });

    /* src\Settings.svelte generated by Svelte v3.44.2 */
    const file$3 = "src\\Settings.svelte";

    function create_fragment$3(ctx) {
    	let h3;
    	let t1;
    	let label0;
    	let t2;
    	let t3;
    	let t4;
    	let input0;
    	let input0_disabled_value;
    	let t5;
    	let label1;
    	let t6;
    	let t7;
    	let t8;
    	let input1;
    	let input1_disabled_value;
    	let t9;
    	let br;
    	let t10;
    	let button;
    	let t11_value = (/*active*/ ctx[2] ? "Stop Feed" : "Start Feed") + "";
    	let t11;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			h3.textContent = "Feed Settings";
    			t1 = space();
    			label0 = element("label");
    			t2 = text("Amount: ");
    			t3 = text(/*amount*/ ctx[0]);
    			t4 = space();
    			input0 = element("input");
    			t5 = space();
    			label1 = element("label");
    			t6 = text("Refresh Rate: ");
    			t7 = text(/*refresh*/ ctx[1]);
    			t8 = space();
    			input1 = element("input");
    			t9 = space();
    			br = element("br");
    			t10 = space();
    			button = element("button");
    			t11 = text(t11_value);
    			add_location(h3, file$3, 13, 0, 385);
    			attr_dev(label0, "for", "amount");
    			add_location(label0, file$3, 14, 0, 409);
    			attr_dev(input0, "type", "range");
    			attr_dev(input0, "min", "3");
    			attr_dev(input0, "max", "10");
    			input0.disabled = input0_disabled_value = !/*$feedStore*/ ctx[3].active;
    			add_location(input0, file$3, 15, 0, 456);
    			attr_dev(label1, "for", "refresh");
    			add_location(label1, file$3, 16, 0, 541);
    			attr_dev(input1, "type", "range");
    			attr_dev(input1, "min", "6");
    			attr_dev(input1, "max", "12");
    			input1.disabled = input1_disabled_value = !/*$feedStore*/ ctx[3].active;
    			add_location(input1, file$3, 17, 0, 595);
    			add_location(br, file$3, 18, 0, 681);
    			add_location(button, file$3, 19, 0, 688);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, label0, anchor);
    			append_dev(label0, t2);
    			append_dev(label0, t3);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, input0, anchor);
    			set_input_value(input0, /*amount*/ ctx[0]);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, label1, anchor);
    			append_dev(label1, t6);
    			append_dev(label1, t7);
    			insert_dev(target, t8, anchor);
    			insert_dev(target, input1, anchor);
    			set_input_value(input1, /*refresh*/ ctx[1]);
    			insert_dev(target, t9, anchor);
    			insert_dev(target, br, anchor);
    			insert_dev(target, t10, anchor);
    			insert_dev(target, button, anchor);
    			append_dev(button, t11);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "change", /*input0_change_input_handler*/ ctx[4]),
    					listen_dev(input0, "input", /*input0_change_input_handler*/ ctx[4]),
    					listen_dev(input1, "change", /*input1_change_input_handler*/ ctx[5]),
    					listen_dev(input1, "input", /*input1_change_input_handler*/ ctx[5]),
    					listen_dev(button, "click", /*click_handler*/ ctx[6], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*amount*/ 1) set_data_dev(t3, /*amount*/ ctx[0]);

    			if (dirty & /*$feedStore*/ 8 && input0_disabled_value !== (input0_disabled_value = !/*$feedStore*/ ctx[3].active)) {
    				prop_dev(input0, "disabled", input0_disabled_value);
    			}

    			if (dirty & /*amount*/ 1) {
    				set_input_value(input0, /*amount*/ ctx[0]);
    			}

    			if (dirty & /*refresh*/ 2) set_data_dev(t7, /*refresh*/ ctx[1]);

    			if (dirty & /*$feedStore*/ 8 && input1_disabled_value !== (input1_disabled_value = !/*$feedStore*/ ctx[3].active)) {
    				prop_dev(input1, "disabled", input1_disabled_value);
    			}

    			if (dirty & /*refresh*/ 2) {
    				set_input_value(input1, /*refresh*/ ctx[1]);
    			}

    			if (dirty & /*active*/ 4 && t11_value !== (t11_value = (/*active*/ ctx[2] ? "Stop Feed" : "Start Feed") + "")) set_data_dev(t11, t11_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(label0);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(input0);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(label1);
    			if (detaching) detach_dev(t8);
    			if (detaching) detach_dev(input1);
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(br);
    			if (detaching) detach_dev(t10);
    			if (detaching) detach_dev(button);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let $feedStore;
    	validate_store(feedStore, 'feedStore');
    	component_subscribe($$self, feedStore, $$value => $$invalidate(3, $feedStore = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Settings', slots, []);
    	let amount = $feedStore.amount;
    	let refresh = $feedStore.refresh;
    	let active = $feedStore.active;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Settings> was created with unknown prop '${key}'`);
    	});

    	function input0_change_input_handler() {
    		amount = to_number(this.value);
    		$$invalidate(0, amount);
    	}

    	function input1_change_input_handler() {
    		refresh = to_number(this.value);
    		$$invalidate(1, refresh);
    	}

    	const click_handler = () => $$invalidate(2, active = !active);

    	$$self.$capture_state = () => ({
    		feedStore,
    		amount,
    		refresh,
    		active,
    		$feedStore
    	});

    	$$self.$inject_state = $$props => {
    		if ('amount' in $$props) $$invalidate(0, amount = $$props.amount);
    		if ('refresh' in $$props) $$invalidate(1, refresh = $$props.refresh);
    		if ('active' in $$props) $$invalidate(2, active = $$props.active);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*amount, refresh, active*/ 7) {
    			feedStore.update(currentSettings => {
    				currentSettings.amount = amount;
    				currentSettings.refresh = refresh;
    				currentSettings.active = active;
    				return currentSettings;
    			});
    		}
    	};

    	return [
    		amount,
    		refresh,
    		active,
    		$feedStore,
    		input0_change_input_handler,
    		input1_change_input_handler,
    		click_handler
    	];
    }

    class Settings extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Settings",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src\Fact.svelte generated by Svelte v3.44.2 */

    const file$2 = "src\\Fact.svelte";

    function create_fragment$2(ctx) {
    	let p;
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(/*factprop*/ ctx[0]);
    			attr_dev(p, "class", "svelte-14aakti");
    			add_location(p, file$2, 4, 0, 48);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*factprop*/ 1) set_data_dev(t, /*factprop*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Fact', slots, []);
    	let { factprop } = $$props;
    	const writable_props = ['factprop'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Fact> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('factprop' in $$props) $$invalidate(0, factprop = $$props.factprop);
    	};

    	$$self.$capture_state = () => ({ factprop });

    	$$self.$inject_state = $$props => {
    		if ('factprop' in $$props) $$invalidate(0, factprop = $$props.factprop);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [factprop];
    }

    class Fact extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { factprop: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Fact",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*factprop*/ ctx[0] === undefined && !('factprop' in props)) {
    			console.warn("<Fact> was created without expected prop 'factprop'");
    		}
    	}

    	get factprop() {
    		throw new Error("<Fact>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set factprop(value) {
    		throw new Error("<Fact>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Feed.svelte generated by Svelte v3.44.2 */
    const file$1 = "src\\Feed.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	return child_ctx;
    }

    // (79:0) {:else}
    function create_else_block_1(ctx) {
    	let h4;
    	let t0;
    	let t1_value = /*$feedStore*/ ctx[1].amount + "";
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			h4 = element("h4");
    			t0 = text("Amount: ");
    			t1 = text(t1_value);
    			t2 = text(" Facts");
    			add_location(h4, file$1, 79, 4, 2739);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h4, anchor);
    			append_dev(h4, t0);
    			append_dev(h4, t1);
    			append_dev(h4, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$feedStore*/ 2 && t1_value !== (t1_value = /*$feedStore*/ ctx[1].amount + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h4);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(79:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (77:32) 
    function create_if_block_2(ctx) {
    	let h4;

    	const block = {
    		c: function create() {
    			h4 = element("h4");
    			h4.textContent = "Too little amount of sentences!";
    			add_location(h4, file$1, 77, 4, 2684);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h4, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h4);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(77:32) ",
    		ctx
    	});

    	return block;
    }

    // (75:0) {#if $feedStore.amount > 9}
    function create_if_block_1(ctx) {
    	let h4;

    	const block = {
    		c: function create() {
    			h4 = element("h4");
    			h4.textContent = "Too many sentences to display!";
    			add_location(h4, file$1, 75, 4, 2605);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h4, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h4);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(75:0) {#if $feedStore.amount > 9}",
    		ctx
    	});

    	return block;
    }

    // (89:0) {:else}
    function create_else_block(ctx) {
    	let h3;

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			h3.textContent = "Loading the Facts......";
    			add_location(h3, file$1, 89, 4, 2940);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(89:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (83:0) {#if facts.length}
    function create_if_block(ctx) {
    	let ol;
    	let current;
    	let each_value = /*facts*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			ol = element("ol");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(ol, file$1, 83, 4, 2816);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ol, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ol, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*facts*/ 1) {
    				each_value = /*facts*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(ol, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(ol);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(83:0) {#if facts.length}",
    		ctx
    	});

    	return block;
    }

    // (85:8) {#each facts as fact}
    function create_each_block(ctx) {
    	let li;
    	let fact;
    	let current;

    	fact = new Fact({
    			props: { factprop: /*fact*/ ctx[8] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			li = element("li");
    			create_component(fact.$$.fragment);
    			add_location(li, file$1, 85, 12, 2865);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			mount_component(fact, li, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const fact_changes = {};
    			if (dirty & /*facts*/ 1) fact_changes.factprop = /*fact*/ ctx[8];
    			fact.$set(fact_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(fact.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(fact.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			destroy_component(fact);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(85:8) {#each facts as fact}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let img;
    	let img_src_value;
    	let t0;
    	let t1;
    	let current_block_type_index;
    	let if_block1;
    	let if_block1_anchor;
    	let current;

    	function select_block_type(ctx, dirty) {
    		if (/*$feedStore*/ ctx[1].amount > 9) return create_if_block_1;
    		if (/*$feedStore*/ ctx[1].amount < 4) return create_if_block_2;
    		return create_else_block_1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);
    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type_1(ctx, dirty) {
    		if (/*facts*/ ctx[0].length) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type_1(ctx);
    	if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			img = element("img");
    			t0 = space();
    			if_block0.c();
    			t1 = space();
    			if_block1.c();
    			if_block1_anchor = empty();
    			if (!src_url_equal(img.src, img_src_value = /*logo*/ ctx[2])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "fff logo");
    			add_location(img, file$1, 72, 0, 2535);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    			insert_dev(target, t0, anchor);
    			if_block0.m(target, anchor);
    			insert_dev(target, t1, anchor);
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(t1.parentNode, t1);
    				}
    			}

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_1(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block1 = if_blocks[current_block_type_index];

    				if (!if_block1) {
    					if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block1.c();
    				} else {
    					if_block1.p(ctx, dirty);
    				}

    				transition_in(if_block1, 1);
    				if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    			if (detaching) detach_dev(t0);
    			if_block0.d(detaching);
    			if (detaching) detach_dev(t1);
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $feedStore;
    	validate_store(feedStore, 'feedStore');
    	component_subscribe($$self, feedStore, $$value => $$invalidate(1, $feedStore = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Feed', slots, []);
    	let logo = "img/fff_logo_sm.jpg";

    	let endpoints = [
    		{
    			URL: "https://catfact.ninja/fact",
    			factprop: "fact"
    		},
    		{
    			URL: "https://v2.jokeapi.dev/joke/Any?type=single",
    			factprop: "joke"
    		},
    		{
    			URL: "http://numbersapi.com/random/math",
    			factprop: ""
    		},
    		{
    			URL: "https://api.punkapi.com/v2/beers/random",
    			factprop: "description"
    		},
    		{
    			URL: "https://geek-jokes.sameerkumar.website/api",
    			factprop: ""
    		},
    		{
    			URL: "https://some-random-api.ml/facts/dog",
    			factprop: "fact"
    		},
    		{
    			URL: "https://some-random-api.ml/facts/panda",
    			factprop: "fact"
    		},
    		{
    			URL: "https://some-random-api.ml/facts/koala",
    			factprop: "fact"
    		},
    		{
    			URL: "https://some-random-api.ml/facts/fox",
    			factprop: "fact"
    		},
    		{
    			URL: "https://some-random-api.ml/facts/bird",
    			factprop: "fact"
    		}
    	];

    	let facts = [];
    	let currentID;

    	const getRandomFact = async () => {
    		let randomFact = "";
    		let fetchIndex = Math.floor(Math.random() * endpoints.length);
    		let url = endpoints[fetchIndex].URL;
    		let factProp = endpoints[fetchIndex].factprop;

    		if (factProp) {
    			let data = await (await fetch(url)).json();

    			if (data[0]) {
    				data = data[0];
    			}

    			randomFact = data[factProp];
    		} else {
    			randomFact = await (await fetch(url)).text();
    		}

    		return randomFact;
    	};

    	const updateFeed = async () => {
    		$$invalidate(0, facts = facts.slice(0, facts.length - 1));
    		$$invalidate(0, facts = [await getRandomFact(), ...facts]);
    	};

    	const initializeFeed = async () => {
    		for (let i = 0; i < $feedStore.amount; i++) {
    			facts.unshift(await getRandomFact());
    		}
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Feed> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		feedStore,
    		Fact,
    		logo,
    		endpoints,
    		facts,
    		currentID,
    		getRandomFact,
    		updateFeed,
    		initializeFeed,
    		$feedStore
    	});

    	$$self.$inject_state = $$props => {
    		if ('logo' in $$props) $$invalidate(2, logo = $$props.logo);
    		if ('endpoints' in $$props) endpoints = $$props.endpoints;
    		if ('facts' in $$props) $$invalidate(0, facts = $$props.facts);
    		if ('currentID' in $$props) $$invalidate(3, currentID = $$props.currentID);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*facts, $feedStore*/ 3) {
    			{
    				while (facts.length < $feedStore.amount && facts.length) {
    					$$invalidate(0, facts = [...facts, '']);
    				}

    				while (facts.length > $feedStore.amount) {
    					$$invalidate(0, facts = facts.slice(0, facts.length - 1));
    				}
    			}
    		}

    		if ($$self.$$.dirty & /*$feedStore, currentID*/ 10) {
    			{
    				if ($feedStore.active) {
    					if (currentID) {
    						clearInterval(currentID);
    					} else {
    						initializeFeed();
    					}

    					$$invalidate(3, currentID = setInterval(updateFeed, $feedStore.refresh * 1000));
    				} else {
    					clearInterval(currentID);
    					$$invalidate(3, currentID = null);
    				}
    			}
    		}
    	};

    	return [facts, $feedStore, logo, currentID];
    }

    class Feed extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Feed",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.44.2 */
    const file = "src\\App.svelte";

    function create_fragment(ctx) {
    	let main;
    	let div2;
    	let div0;
    	let settings;
    	let t;
    	let div1;
    	let feed;
    	let current;
    	settings = new Settings({ $$inline: true });
    	feed = new Feed({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			div2 = element("div");
    			div0 = element("div");
    			create_component(settings.$$.fragment);
    			t = space();
    			div1 = element("div");
    			create_component(feed.$$.fragment);
    			attr_dev(div0, "id", "settings");
    			attr_dev(div0, "class", "svelte-o8y0ui");
    			add_location(div0, file, 7, 2, 127);
    			attr_dev(div1, "id", "feed");
    			attr_dev(div1, "class", "svelte-o8y0ui");
    			add_location(div1, file, 10, 2, 174);
    			attr_dev(div2, "id", "container");
    			attr_dev(div2, "class", "svelte-o8y0ui");
    			add_location(div2, file, 6, 1, 104);
    			attr_dev(main, "class", "svelte-o8y0ui");
    			add_location(main, file, 5, 0, 96);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div2);
    			append_dev(div2, div0);
    			mount_component(settings, div0, null);
    			append_dev(div2, t);
    			append_dev(div2, div1);
    			mount_component(feed, div1, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(settings.$$.fragment, local);
    			transition_in(feed.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(settings.$$.fragment, local);
    			transition_out(feed.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(settings);
    			destroy_component(feed);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Settings, Feed });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
