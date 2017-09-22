(function(app) {
  var content = app.content;

  var helper = (function() {
    var helper = {};

    helper.ramdomInt = function(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    helper.sample = function(array) {
      return array[helper.ramdomInt(0, array.length - 1)];
    };

    helper.shuffle = function(array) {
      var copy = array.slice();
      for (var i = copy.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = copy[i];
        copy[i] = copy[j];
        copy[j] = tmp;
      }
      return copy;
    };

    return helper;
  })();

  var dom = (function() {
    var dom = {};

    dom.el = function(selectors) {
      return document.querySelector(selectors);
    };

    dom.child = function() {
      return Array.prototype.slice.call(arguments).reduce(function(el, index) {
        return ('children' in el ? el.children[index] : null);
      });
    };

    dom.render = function(s) {
      var el = document.createRange().createContextualFragment(s).firstChild;
      el.parentNode.removeChild(el);
      return el;
    };

    dom.toggleClass = function(el, className, force) {
      if (force) {
        el.classList.add(className);
      } else {
        el.classList.remove(className);
      }
    };

    dom.scrollTop = function(value) {
      document.documentElement.scrollTop = value;
      document.body.scrollTop = value;
    };

    dom.removeFocus = function() {
      document.activeElement.blur();
    };

    dom.eventType = function(name) {
      var supportsTouch = dom.supportsTouch();
      switch (name) {
        case 'start':
          return (supportsTouch ? 'touchstart' : 'mousedown');
        case 'move':
          return (supportsTouch ? 'touchmove' : 'mousemove');
        case 'end':
          return (supportsTouch ? 'touchend' : 'mouseup');
        default:
          throw new Error('Invalid event type');
      }
    };

    dom.on = function(el, type, listener, useCapture) {
      el.addEventListener(type, listener, !!useCapture);
    };

    dom.off = function(el, type, listener, useCapture) {
      el.removeEventListener(type, listener, !!useCapture);
    };

    dom.ready = function(listener) {
      document.addEventListener('DOMContentLoaded', listener, false);
    };

    dom.supportsTouch = function() {
      return ('createTouch' in document);
    };

    dom.target = function(event) {
      var touch = (dom.supportsTouch() ? event.changedTouches[0] : null);
      return (touch ? document.elementFromPoint(touch.clientX, touch.clientY) : event.target);
    };

    dom.cancel = function(event) {
      event.preventDefault();
    };

    dom.ajax = function(opt) {
      var type = opt.type;
      var url = opt.url;
      return new Promise(function(resolve, reject) {
        var req = new XMLHttpRequest();
        var onfailed = function() {
          reject(new Error('Failed to load resource: ' + type + ' ' + url));
        };
        req.onload = function() {
          if (req.status >= 200 && req.status < 400) {
            resolve(req.response);
          } else {
            onfailed();
          }
        };
        req.onerror = onfailed;
        req.onabort = onfailed;
        req.open(type, url, true);
        req.send();
      });
    };

    dom.location = function() {
      return document.location;
    };

    dom.urlFragment = function(url, value) {
      if (typeof value !== 'undefined') {
        url.hash = '#' + value;
        return;
      }
      return url.hash.substring(1);
    };

    dom.Draggable = (function() {
      var Draggable = function(props) {
        this.element = props.element;
        this.onstart = props.onstart;
        this.onmove = props.onmove;
        this.onend = props.onend;
        this.move = this.move.bind(this);
        this.end = this.end.bind(this);
        this.context = {};
        dom.on(this.element, dom.eventType('start'), this.start.bind(this));
      };

      Draggable.prototype.start = function(event) {
        dom.on(document, dom.eventType('move'), this.move);
        dom.on(document, dom.eventType('end'), this.end);
        if (typeof this.onstart === 'function') {
          this.onstart(event, this.context);
        }
      };

      Draggable.prototype.move = function(event) {
        if (typeof this.onmove === 'function') {
          this.onmove(event, this.context);
        }
      };

      Draggable.prototype.end = function(event) {
        dom.off(document, dom.eventType('move'), this.move);
        dom.off(document, dom.eventType('end'), this.end);
        if (typeof this.onend === 'function') {
          this.onend(event, this.context);
        }
      };

      return Draggable;
    })();

    return dom;
  })();

  var Panel = (function() {
    var Panel = function(props) {
      this.element = props.element;
      new dom.Draggable({
        element: this.element,
        onstart: this.onstart.bind(this),
        onend: this.onend.bind(this),
      });
    };

    Panel.prototype.html = function(text) {
      this.element.replaceChild(dom.render(text), dom.child(this.element, 0));
    };

    Panel.prototype.empty = function() {
      this.html('<svg></svg>');
    };

    Panel.prototype.isActive = function(value) {
      dom.toggleClass(this.element, 'panel-active', value);
    };

    Panel.prototype.onstart = function() {
      this.isActive(true);
    };

    Panel.prototype.onend = function() {
      this.isActive(false);
    };

    return Panel;
  })();

  var Button = (function() {
    var Button = function(props) {
      this.element = props.element;
      this.tapper = props.tapper;
      new dom.Draggable({
        element: this.element,
        onstart: this.onstart.bind(this),
        onmove: this.onmove.bind(this),
        onend: this.onend.bind(this),
      });
    };

    Button.prototype.isActive = function(value) {
      dom.toggleClass(this.element, 'active', value);
    };

    Button.prototype.disabled = function(value) {
      dom.toggleClass(this.element, 'disabled', value);
    };

    Button.prototype.onstart = function(event, context) {
      context.target = dom.target(event);
      dom.cancel(event);
      dom.removeFocus();
      this.isActive(true);
    };

    Button.prototype.onmove = function(event, context) {
      this.isActive(dom.target(event) === context.target);
    };

    Button.prototype.onend = function(event, context) {
      this.isActive(false);
      if (dom.target(event) === context.target) {
        this.tapper();
      }
    };

    return Button;
  })();

  var Body = (function() {
    var Body = function(props) {
      this.images = props.images;
      this.panels = [
        new Panel({ element: dom.el('.panel[data-index="0"]') }),
        new Panel({ element: dom.el('.panel[data-index="1"]') }),
        new Panel({ element: dom.el('.panel[data-index="2"]') }),
        new Panel({ element: dom.el('.panel[data-index="3"]') }),
      ];
      this.button = new Button({
        element: dom.el('.reload-button'),
        tapper: this.onreload.bind(this),
      });
      dom.ready(this.onload.bind(this));
    };

    Body.prototype.imagePath = function(name) {
      return 'images/' + name + '.svg';
    };

    Body.prototype.shuffledImageNames = function() {
      return helper.shuffle(this.images.filter(function(image) {
        return !image.last;
      })).slice(0, 3).map(function(image) {
        return image.name;
      }).concat(helper.sample(this.images.filter(function(image) {
        return image.last;
      })).name);
    };

    Body.prototype.hashToImageNames = function(hash) {
      return (hash.match(/(.{7})(.{7})(.{7})(.{7})/) || []).slice(1);
    };

    Body.prototype.clearPanels = function() {
      this.panels.forEach(function(panel) {
        panel.empty();
      });
    };

    Body.prototype.loadPanels = function(names) {
      var fragment = names.join('');
      var urls = names.map(function(name) {
        return this.imagePath(name);
      }.bind(this));
      return Promise.all(urls.map(function(url) {
        return dom.ajax({ type: 'GET', url: url });
      })).then(function(texts) {
        texts.forEach(function(text, index) {
          this.panels[index].html(text);
        }.bind(this));
      }.bind(this)).then(function() {
        dom.urlFragment(dom.location(), fragment);
      });
    };

    Body.prototype.onload = function() {
      var hash = dom.urlFragment(dom.location());
      var imageNames = this.hashToImageNames(hash);
      if (imageNames.length !== this.panels.length) {
        imageNames = this.shuffledImageNames();
      }
      this.button.disabled(true);
      this.clearPanels();
      this.loadPanels(imageNames).then(function() {
        this.button.disabled(false);
      }.bind(this)).catch(function(e) {
        this.button.disabled(false);
        throw e;
      }.bind(this));
    };

    Body.prototype.onreload = function() {
      dom.scrollTop(0);
      this.button.disabled(true);
      this.clearPanels();
      this.loadPanels(this.shuffledImageNames()).then(function() {
        this.button.disabled(false);
      }.bind(this)).catch(function(e) {
        this.button.disabled(false);
        throw e;
      }.bind(this));
    };

    return Body;
  })();

  new Body({ images: content.images });
})(this.app || (this.app = {}));
