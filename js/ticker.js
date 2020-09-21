var DestinationEnum = Object.freeze({
    "HARDWARE_AND_SOFTWARE": 0,
    "HARDWARE_ONLY": 1,
    "SOFTWARE_ONLY": 2
});

var websocket = null;
var pluginUUID = null;
var canvas;
var canvasContext;
var titleParameters;
var bitfinexWsByContext = {};

const exchanceConns = {
    'binanceFuts': new ccxt.binance({
        'apiKey': 'xxxx',
        'secret': 'xxxx',
        'enableRateLimit': true,
        options: { defaultType: 'future' }
    }),
    'bitmex': new ccxt.bitmex({
        'apiKey': 'xxxx',
        'secret': 'xxxx'
    })

}

async function onkeydown(context, settings) {
    const exch = exchanceConns[settings.exchange]
    exch.urls.api = exch.urls.test // testnet

    const marketId = settings.pair

    if (settings.ordertype === 'limit') {
        const bidAsk = await exch.fetchBidsAsks(settings.pair)
        const { bid, ask } = bidAsk[settings.pair]

        switch (settings['order-direction']) {
            case 'bid':
                return exch.createOrder(marketId, 'LIMIT', 'BUY', amount = settings.size, price = bid - (bid * 0.0001))
            case 'ask':
                return exch.createOrder(marketId, 'LIMIT', 'SELL', amount = settings.size, price = ask + (ask * 0.0001))
            default:
                console.warn('Invalid order direction', settings)
                break;
        }

    } else if (settings.ordertype === 'market') {
        switch (settings['order-direction']) {
            case 'bid':
                return exch.createOrder(marketId, 'MARKET', 'BUY', amount = settings.size)
            case 'ask':
                return exch.createOrder(marketId, 'MARKET', 'SELL', amount = settings.size)
            default:
                console.warn('Invalid order direction', settings)
                break;
        }
    }
}

function connectElgatoStreamDeckSocket(inPort, inPluginUUID, inRegisterEvent, inApplicationInfo, inActionInfo) {
    pluginUUID = inPluginUUID;

    websocket = new WebSocket("ws://127.0.0.1:" + inPort);

    function registerPlugin(inPluginUUID) {
        var json = {
            "event": inRegisterEvent,
            "uuid": inPluginUUID
        };

        websocket.send(JSON.stringify(json));
    };

    websocket.onopen = function() {
        registerPlugin(pluginUUID);
    };

    websocket.onmessage = function(evt) {
        console.log('----')
        const jsonObj = JSON.parse(evt.data);

        // Received message from Stream Deck
        const event = jsonObj['event'];
        const action = jsonObj['action'];
        const context = jsonObj['context'];
        const jsonPayload = jsonObj['payload'] || {};

        const settings = jsonPayload['settings'];
        titleParameters = jsonPayload['titleParameters'];

        console.log("[tile]", event, jsonObj);

        switch (event) {
            case "keyUp":
                // tickerAction.onKeyDown(context, settings, coordinates, userDesiredState);
                break;
            case "keyDown":
                const promise = onkeydown(context, settings)
                const t0 = performance.now()
                promise.then(x => {
                    const t1 = performance.now()
                    console.log("request took " + (t1 - t0) + " milliseconds.")

                    websocket.send(JSON.stringify({
                        "event": "showOk",
                        "context": context
                    }));
                    setTimeout(() => {
                        refreshTile(websocket, context, settings, titleParameters);
                    }, 500)
                }).catch(ex => {
                    console.warn(ex)
                    websocket.send(JSON.stringify({
                        "event": "showAlert",
                        "context": context
                    }));
                    setTimeout(() => {
                        refreshTile(websocket, context, settings, titleParameters);
                    }, 500)
                })
                break;
            case "willAppear":
                // tickerAction.onWillAppear(context, settings, coordinates);
                //break;
            case 'titleParametersDidChange':
            case "didReceiveSettings":
                console.log("[tile] Received settings", settings);
                if (settings.exchange) {
                    if (!settings.ordertype) settings.ordertype = "market"
                    refreshTile(websocket, context, settings, titleParameters);
                }

                break;
            case 'propertyInspectorDidAppear':
                break;
            case 'propertyInspectorDidDisappear':
                break;
            default:
                console.debug('[tile] Unhandled event', event)
                break;
        }
    };

    websocket.onclose = function(evt) {
        console.log("[tile] closed", evt);
    };
};
