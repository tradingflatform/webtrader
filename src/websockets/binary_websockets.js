/**
 * Created by arnab on 2/24/15.
 */

define(['reconnecting-websocket'], function (ReconnectingWebSocket) {

    var Cookies = null,
        tokenWin = null;
    /* these dependencies are only need for authenticated api sends.
       load them on demand, so websocket can start before loading them.  */
    var authentication_deps = new Promise(function (resolve, reject) {
        require(['js-cookie', 'token/token'], function (_cookies, _tokenwin) {
            Cookies = _cookies;
            tokenWin = _tokenwin;
            resolve();
        });
    });
    /* don't wait for an authenticated request, trigger loading these now */
    require(['js-cookie', 'token/token']);

    var is_authenitcated_session = false; /* wether or not the current websocket session is authenticated */

    var connect = function () {
        var api_url = 'wss://www.binary.com/websockets/v3?l=EN';
        var ws = new ReconnectingWebSocket(api_url, null, { debug: false, timeoutInterval: 2500 });

        ws.addEventListener('open', onopen);
        ws.addEventListener('close', onclose);
        ws.addEventListener('message', onmessage);

        return ws;
    }

    var onclose = function () {
        is_authenitcated_session = false;
        /* the connection is closed, resubscrible to tick streaming */
        require(['charts/chartingRequestMap'], function (map) {
            Object.keys(map).forEach(function (key) {
                var req = map[key];
                var instrumentCode = req && req.chartIDs && req.chartIDs[0] && req.chartIDs[0].instrumentCode;

                /* resubscribe */
                if (req && instrumentCode)
                    api.send({ ticks: instrumentCode, passthrough: { instrumentCdAndTp: key } })
                        .then(function (data) {
                            req.tickStreamingID = data.tick.id;
                        })
                        .catch(function (err) {
                            console.error(err);
                        });
            });
        });
    }

    var callbacks = {};
    var buffered_execs = [];
    var buffered_sends = [];
    var unresolved_promises = {};
    var cached_promises = {}; /* requests that have been cached */
    var is_connected = function () {
        return socket && socket.readyState === 1;
    }
   
    var onopen = function () {
        /* send buffered sends */
        while (buffered_sends.length > 0) {
            socket.send(JSON.stringify(buffered_sends.shift()));
        }
        while (buffered_execs.length > 0)
            buffered_execs.shift()();
    }

    /* execute buffered executes */
    var onmessage = function (message) {
        var data = JSON.parse(message.data);

        (callbacks[data.msg_type] || []).forEach(function (cb) {
            cb(data);
        });

        var key = data.echo_req.passthrough && data.echo_req.passthrough.uid;
        var promise = unresolved_promises[key];
        if (promise) {
            delete unresolved_promises[key];
            if (data.error)
                promise.reject(data.error);
            else
                promise.resolve(data);
        }
    }

    var socket = connect();
    //This is triggering asycn loading of tick_handler. 
    //The module will automatically start working as soon as its loaded
    require(['websockets/tick_handler']); // require tick_handler to handle ticks.

    /* whether the given request needs authentication or not */
    var needs_authentication = function (data) {
        for (prop in { balance: 1, statement: 1, profit_table: 1, portfolio: 1, proposal_open_contract: 1, buy: 1, sell: 1 })
            if (prop in data)
                return true;
        return false;
    };

    /* send a raw request and return a promise */
    var send_request = function (data) {
        data.passthrough = data.passthrough || { };
        data.passthrough.uid =  (Math.random() * 1e17).toString();

        return new Promise(function (resolve,reject) {
            unresolved_promises[data.passthrough.uid] = { resolve: resolve, reject: reject };
            if (is_connected())
                socket.send(JSON.stringify(data));
            else
                buffered_sends.push(data);
        });
    };

    /* authenticate and return a promise */
    var authenticate = function (token) {
        var auth_successfull = false,
            key = JSON.stringify({ authorize: token }),
            promise = send_request({ authorize: token });

        return promise
            .then(function (val) {
                Cookies.set('webtrader_token', token); /* never expiers */
                is_authenitcated_session = true;
                auth_successfull = true;
                cached_promises[key] = promise; /* cache successfull authentication */
                return val; /* pass the result */
            })
            .catch(function (up) {
                if (!auth_successfull) {    /* authentication request is failed, delete the cookie */
                    is_authenitcated_session = false;
                    Cookies.remove('webtrader_token');
                }
                delete cached_promises[key];
                throw up; /* pass the exception to next catch */
            });
    };

    /* first authenticate and then send the request */
    var send_authenticated_request = function (data) {
        if (is_authenitcated_session)
            return send_request(data);

        var send = send_request.bind(null,data);// function () { return send_request(data); };

        if (Cookies.get('webtrader_token'))     /* we have a cookie for the token */
            return authenticate(Cookies.get('webtrader_token'))
                    .then(send);
        else                                    /* get the token from user */
            return tokenWin
                .getTokenAsync()
                .then(authenticate)
                .then(send);
    };

    var api = {
        events: {
            on: function (name, cb) {
                (callbacks[name] = callbacks[name] || []).push(cb);
            }
        },
        /* execute callback when the connection is ready */
        execute: function (cb) {
            if (is_connected())
                setTimeout(cb, 0);// always run the callback async
            else
                buffered_execs.push(cb);
        },
        /* if you want a request to be cached, that is when multiple modules request 
           the same data or a module request a data multiple times, instead of calling
           liveapi.send can liveapi.cached.send.
           node: this will only cache if the result was successfull */
        cached :{
            send: function(data){
                var key = JSON.stringify(data);
                /* if there is a cached promise for this key (let say P), return P.
                 * assume P is in pending state, when P is fullfiled all attached .then() calls will run.
                 * assume P is in rejected state (or in fullfiled state), the changed .then() calls will be immediately rejected(or fullfiled).  */
                if (cached_promises[key])
                    return cached_promises[key];
                /* We don't want to cache promises that are rejected,
                   Clear the cache in case of promise rejection */
                return cached_promises[key] = api.send(data)
                    .then(
                        function (val) {
                            return val;
                        }, /* on resolve: do nothing */
                        function (up) {
                            delete cached_promises[key]; throw up;
                        } /* on reject: clear cache */
                    );
            },
            /* return the promise from last successfull authentication request,
               if the session is not already authorized will send an authentication request */
            authorize: function () {
                return authentication_deps.then(function () {
                    var token = Cookies.get('webtrader_token'),
                        key = JSON.stringify({ token: token });

                    if (is_authenitcated_session && token && cached_promises[key])
                        return cached_promises[key];

                    return token ? authenticate(token) : /* we have a token => autheticate */
                                      tokenWin.getTokenAsync().then(authenticate); /* get the token from user and authenticate */
                })
            }
        },
        /* sends a request and returns an es6-promise */
        send: function (data) {
            if (needs_authentication(data))
                return authentication_deps.then(function () {
                    return send_authenticated_request(data);
                });
            return send_request(data);
        }
    }
    return api;
});
