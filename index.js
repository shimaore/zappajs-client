// Generated by CoffeeScript 1.10.0
(function() {
  var debug, domready, invariate, observable, pkg, request, riot, socketio, zappa,
    hasProp = {}.hasOwnProperty;

  pkg = {
    name: 'zappajs-client'
  };

  debug = (require('debug'))(pkg.name);

  request = (require('superagent-as-promised'))(require('superagent'));

  socketio = require('socket.io-client');

  domready = require('domready');

  observable = (riot = require('riot')).observable;

  invariate = require('invariate');

  zappa = function(options, f) {
    var build_ctx, context, ev, io, ref, ref1, share;
    if (typeof options === 'function') {
      ref = [{}, options], options = ref[0], f = ref[1];
    }
    if (options == null) {
      options = {};
    }
    context = {};
    ev = context.ev = observable();
    io = context.io = socketio((ref1 = options.io) != null ? ref1 : {});
    context.request = request;
    context.riot = riot;
    build_ctx = function(o) {
      var ctx, k, v;
      ctx = {
        ev: context.ev,
        io: context.io,
        request: context.request,
        riot: context.riot,
        emit: context.emit,
        on: context.on
      };
      for (k in o) {
        if (!hasProp.call(o, k)) continue;
        v = o[k];
        ctx[k] = v;
      }
      return ctx;
    };
    context.ready = function(f) {
      return context.ev.on('ready', function() {
        var ctx;
        ctx = build_ctx({
          settings: context.settings
        });
        return f.apply(ctx);
      });
    };
    context.start = function() {
      riot.route.start();
      return riot.route.exec();
    };
    context.get = context.route = invariate(function(k, v) {
      return riot.route(k, function() {
        var ctx;
        ctx = build_ctx({
          params: arguments,
          query: riot.route.query()
        });
        return v.apply(ctx, arguments);
      });
    });
    context.on = invariate(function(event, action) {
      return io.on(event, function(data, ack) {
        var ctx;
        ctx = build_ctx({
          event: event,
          data: data,
          ack: ack
        });
        return action.apply(ctx, arguments);
      });
    });
    context.emit = invariate.acked(function(event, data, ack) {
      return io.emit.call(io, event, data, function(ack_data) {
        var ctx;
        ctx = build_ctx({
          event: event,
          data: ack_data
        });
        return ack.apply(ctx, arguments);
      });
    });
    if (f != null) {
      f.call(context, context);
    }
    share = function(next) {
      var channel_name, ref2, ref3, uri, zappa_prefix;
      zappa_prefix = (ref2 = context.settings.zappa_prefix) != null ? ref2 : '/zappa';
      channel_name = (ref3 = context.settings.zappa_channel) != null ? ref3 : '__local';
      uri = zappa_prefix + "/socket/" + channel_name + "/" + io.id;
      debug("Requesting " + uri);
      return request.get(uri).accept('json')["catch"](function(error) {
        return {
          body: {
            key: null
          }
        };
      }).then(function(arg) {
        var key;
        key = arg.body.key;
        if (key != null) {
          debug("Sending __zappa_key to server", {
            key: key
          });
          return io.emit('__zappa_key', {
            key: key
          }, next);
        } else {
          return next({
            key: null
          });
        }
      });
    };
    io.on('connect', function() {
      debug("Connect");
      io.emit('__zappa_settings', null, function(settings) {
        debug('Received settings', settings);
        context.settings = settings;
        return share(function(arg) {
          var key;
          key = arg.key;
          debug('Received key', key);
          context.key = key;
          return domready(function() {
            debug('DOM is ready');
            return ev.trigger('ready');
          });
        });
      });
      return debug("Waiting for Zappa settings");
    });
    return context;
  };

  module.exports = zappa;

  module.exports.request = request;

  module.exports.io = socketio;

  module.exports.riot = riot;

}).call(this);

//# sourceMappingURL=index.js.map
