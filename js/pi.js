// this is our global websocket, used to communicate from/to Stream Deck software
// and some info about our plugin, as sent by Stream Deck software
let websocket = null,
    uuid = null,
    actionInfo = {},
    inInfo = {};


let exchangesList = [],
    allPairs = {};

let currentPair = "BTCUSD";
let currentCandlesInterval = "1h";
let currentMultiplier = 1;
let currentDigits = 2;
let currentFont = "Lato,'Roboto Condensed',Helvetica,Calibri,sans-serif";
let currentBackgroundColor = "#000000";
let currentTextColor = "#ffffff";
let currentDisplayHighLow = "on";
let currentDisplayHighLowBar = "on";
let currentAlertRule = "";
let currentBackgroundColorRule = "";
let currentTextColorRule = "";
let currentMode = "ticker";

const exchangesDropDown = document.getElementById("exchanges");
const pairsDropDown = document.getElementById("trading-pairs");
const orderDirectionDropDown = document.getElementById("order-direction");
const orderTypeDropDown = document.getElementById("ordertype");


const Utils = {
    clearOptions: function(selectElement) {
        var i, L = selectElement.options.length - 1;
        for (i = L; i >= 0; i--) {
            selectElement.remove(i);
        }
    },

    // Sends one value to the sendToPlugin method
    sendValueToPlugin: (websocket, actionInfo, uuid) => (value, param) => {
        if (websocket && (websocket.readyState === 1)) {
            const json = {
                'action': actionInfo['action'],
                'event': 'sendToPlugin',
                'context': uuid,
                'payload': {
                    [param]: value
                }
            };
            websocket.send(JSON.stringify(json));
        }
    },
    setSettingsToPlugin: (websocket, uuid) => (payload) => {
        if (websocket && (websocket.readyState === 1)) {
            const json = {
                'event': 'setSettings',
                'context': uuid,
                'payload': payload
            };
            websocket.send(JSON.stringify(json));
            // var event = new Event('settingsUpdated');
            // document.dispatchEvent(event);
        }
    },
    getGlobalSettings: (websocket, uuid) => {
        if (websocket && (websocket.readyState === 1)) {
            const json = {
                'event': 'getGlobalSettings',
                'context': uuid
            };
            websocket.send(JSON.stringify(json))
        }
    },
    setGlobalSettings: (websocket, uuid) => (payload) => {
        if (websocket && (websocket.readyState === 1)) {
            const json = {
                'event': 'setGlobalSettings',
                'context': uuid,
                'payload': payload
            };
            websocket.send(JSON.stringify(json));
            // var event = new Event('settingsUpdated');
            // document.dispatchEvent(event);
        }
    },
    loadConfiguration: (payload) => {
        console.log('loadConfiguration', payload)
        for (var key in payload) {
            try {
                var elem = document.getElementById(key);
                if (!elem) continue
                if (elem.classList.contains("sdCheckbox")) { // Checkbox
                    elem.checked = payload[key];
                } else if (elem.classList.contains("sdFile")) { // File
                    var elemFile = document.getElementById(elem.id + "Filename");
                    elemFile.innerText = payload[key];
                    if (!elemFile.innerText) {
                        elemFile.innerText = "No file...";
                    }
                } else if (elem.classList.contains("sdList")) { // Dynamic dropdown
                    var textProperty = elem.getAttribute("sdListTextProperty");
                    var valueProperty = elem.getAttribute("sdListValueProperty");
                    var valueField = elem.getAttribute("sdValueField");

                    var items = payload[key];
                    elem.options.length = 0;

                    for (var idx = 0; idx < items.length; idx++) {
                        var opt = document.createElement('option');
                        opt.value = items[idx][valueProperty];
                        opt.text = items[idx][textProperty];
                        elem.appendChild(opt);
                    }
                    elem.value = payload[valueField];
                } else if (elem.classList.contains("sdHTML")) { // HTML element
                    elem.innerHTML = payload[key];
                } else { // Normal value
                    elem.value = payload[key];
                }
                console.log("Load: " + key + "=" + payload[key]);
            } catch (err) {
                console.log("loadConfiguration failed for key: " + key + " - " + err);
                throw err
            }
        }
    }
}


let Trader = {
    init: async function() {
        await this.initExchangeList()
        const instance = this
        exchangesDropDown.onchange = (ev) => {
            console.log('onExchangeChange', ev.target.value)
            instance.loadPairsForExchange(ev.target.value)
        }
    },

    loadPairsForExchange: async function(exchange) {

    },





    // initPairsDropDown: async() => {
    //     const pairs = await this.getPairs();
    //     //console.log(pairs);
    //     pairs.sort();
    //     pairs.forEach(function(pair) {
    //         console.log(pair)
    //         var option = document.createElement("option");
    //         option.text = pair.name;
    //         option.value = pair.id;
    //         pairsDropDown.add(option);
    //     });

    //     this.refreshValues();
    // }
}

let pi = {
    initDom: () => {
        const jThis = this;

        this.initExchangeList()
        exchangesDropDown.onchange = (ev) => {
            console.log('onExchangeChange', ev.target.value)
            jThis.loadPairsForExchange(ev.target.value)
        }

        // this.initPairsDropDown();

        var callback = function() {
                jThis.checkNewSettings();
            }
            // pairsDropDown.onchange = callback;
        candlesIntervalDropDown.onchange = callback;

        multiplierInput.onchange = callback;
        multiplierInput.onkeyup = callback;

        digitsInput.onchange = callback;
        digitsInput.onkeyup = callback;

        fontInput.onchange = callback;
        fontInput.onkeyup = callback;

        backgroundColorInput.onchange = callback;
        textColorInput.onchange = callback;

        highLowCheck.onchange = callback;
        highLowBarCheck.onchange = callback;

        alertRuleInput.onchange = callback;
        alertRuleInput.onkeyup = callback;

        backgroundColorRuleInput.onchange = callback;
        backgroundColorRuleInput.onkeyup = callback;

        textColorRuleInput.onchange = callback;
        textColorRuleInput.onkeyup = callback;
    },

    getPairs: async function() {
        const response = await fetch("https://api-pub.bitfinex.com/v2/conf/pub:list:pair:exchange");
        const responseJson = await response.json();

        return responseJson[0];
    },
    extractSettings: function(settings) {
        currentPair = settings["pair"] || currentPair;
        currentCandlesInterval = settings["candlesInterval"] || currentCandlesInterval;
        currentMultiplier = settings["multiplier"] || currentMultiplier;
        currentDigits = settings["digits"] || currentDigits;
        currentFont = settings["font"] || currentFont;
        currentBackgroundColor = settings["backgroundColor"] || currentBackgroundColor;
        currentTextColor = settings["textColor"] || currentTextColor;
        currentDisplayHighLow = settings["displayHighLow"] || currentDisplayHighLow;
        currentDisplayHighLowBar = settings["displayHighLowBar"] || currentDisplayHighLowBar;
        currentAlertRule = settings["alertRule"] || currentAlertRule;
        currentBackgroundColorRule = settings["backgroundColorRule"] || currentBackgroundColorRule;
        currentTextColorRule = settings["textColorRule"] || currentTextColorRule;
        currentMode = settings["mode"] || currentMode;
    },
    checkNewSettings: function() {
        currentPair = pairsDropDown.value;
        currentCandlesInterval = candlesIntervalDropDown.value;
        currentMultiplier = multiplierInput.value;
        currentDigits = digitsInput.value;
        currentFont = fontInput.value;
        currentBackgroundColor = backgroundColorInput.value;
        currentTextColor = textColorInput.value;
        currentDisplayHighLow = highLowCheck.checked ? "on" : "off";
        currentDisplayHighLowBar = highLowBarCheck.checked ? "on" : "off";
        currentAlertRule = alertRuleInput.value;
        currentBackgroundColorRule = backgroundColorRuleInput.value;
        currentTextColorRule = textColorRuleInput.value;

        this.saveSettings();
    },
    refreshValues: function() {
        pairsDropDown.value = currentPair;
        candlesIntervalDropDown.value = currentCandlesInterval;
        multiplierInput.value = currentMultiplier;
        digitsInput.value = currentDigits;
        fontInput.value = currentFont;
        backgroundColorInput.value = currentBackgroundColor;
        textColorInput.value = currentTextColor;

        highLowCheck.checked = currentDisplayHighLow != "off";
        highLowBarCheck.checked = currentDisplayHighLowBar != "off";

        alertRuleInput.value = currentAlertRule;
        backgroundColorRuleInput.value = currentBackgroundColorRule;
        textColorRuleInput.value = currentTextColorRule;
    },
    saveSettings: function() {
        const newSettings = {
            "pair": currentPair,
            "candlesInterval": currentCandlesInterval,
            "multiplier": currentMultiplier,
            "digits": currentDigits,
            "font": currentFont,
            "backgroundColor": currentBackgroundColor,
            "textColor": currentTextColor,
            "displayHighLow": currentDisplayHighLow,
            "displayHighLowBar": currentDisplayHighLowBar,
            "alertRule": currentAlertRule,
            "backgroundColorRule": currentBackgroundColorRule,
            "textColorRule": currentTextColorRule,
            "mode": currentMode,
        };
        // console.log(newSettings);

        if (websocket && (websocket.readyState === 1)) {
            const jsonSetSettings = {
                "event": "setSettings",
                "context": uuid,
                "payload": newSettings
            };
            websocket.send(JSON.stringify(jsonSetSettings));

            const jsonPlugin = {
                "action": actionInfo["action"],
                "event": "sendToPlugin",
                "context": uuid,
                "payload": newSettings
            };
            websocket.send(JSON.stringify(jsonPlugin));
        }
    }
}


function connectElgatoStreamDeckSocket(inPort, inUUID, inRegisterEvent, inInfo, inActionInfo) {
    uuid = inUUID;
    // registerEventName = inRegisterEvent;
    actionInfo = JSON.parse(inActionInfo); // cache the info
    inInfo = JSON.parse(inInfo);
    console.log('[PI] actionInfo', actionInfo)
    console.log('[PI] inInfo', inInfo)

    websocket = new WebSocket('ws://127.0.0.1:' + inPort);

    websocket.onopen = websocketOnOpen(inRegisterEvent, uuid);
    websocket.onmessage = websocketOnMessage;
    websocket.onerror = (err) => console.error(err)
    websocket.onclose = (err) => console.log('ws close', err)

    const settings = actionInfo.payload.settings;
    console.log('[PI] setttings', settings)

    initConfiguration(settings).then(x => {
        Utils.loadConfiguration(actionInfo.payload.settings);
    })

};

function initExchangeList(selected) {
    const exchanges = [
        { id: 'bitmex', name: 'Bitmex' },
        { id: 'binanceFuts', name: 'Binance Futures' },
        { id: 'bitfinex', name: 'Bitfinex' },
        { id: 'ftx', name: 'FTX' },
    ]
    exchanges.forEach((pair) => {
        var option = document.createElement("option");
        option.text = pair.name;
        option.value = pair.id;

        option.selected = selected === pair.id

        exchangesDropDown.add(option);
    });

    const t = this;
    exchangesDropDown.onchange = (ev) => {
        console.log('onExchangeChange', ev.target.value)
        onExchangeChange(ev.target.value, allPairs[0], allPairs)
    }

    orderTypeDropDown.onchange = (ev) => {
        console.log('onOrderTypeChange', ev.target.value)
        onOrderTypeChange(ev.target.value)
    }

    exchangesList = exchanges
    return exchanges
};

async function fetchPairs(exchange) {
    let exh;
    switch (exchange) {
        case 'bitmex':
            exch = new ccxt.bitmex()
            break;
        case 'binanceFuts':
            exch = new ccxt.binance({
                options: { defaultType: 'future' }
            })
            break;
        case 'ftx':
            exch = new ccxt.ftx()
            break;
        case 'bitfinex':
            exch = new ccxt.bitfinex2()
            break;
        default:
            return []
    }
    const markets = await exch.loadMarkets()
    return Object.keys(markets).filter(x => !x.startsWith('.')).sort()
};

function onExchangeChange(selectedExchange, selectedPair, exchpairs) {
    Utils.clearOptions(pairsDropDown)

    console.log('onch', selectedExchange, selectedPair)
    const pairs = exchpairs[selectedExchange]
    pairs.forEach(function(pair) {
        var option = document.createElement("option");
        option.text = pair;
        option.value = pair;
        option.selected = selectedPair === pair;
        pairsDropDown.add(option);
    });
}

function onOrderTypeChange() {

}

function setSettings(ev) {
    var payload = {};
    var elements = document.getElementsByClassName("sdProperty");

    Array.prototype.forEach.call(elements, function(elem) {
        var key = elem.id;
        if (elem.classList.contains("sdCheckbox")) { // Checkbox
            payload[key] = elem.checked;
        } else if (elem.classList.contains("sdFile")) { // File
            var elemFile = document.getElementById(elem.id + "Filename");
            payload[key] = elem.value;
            if (!elem.value) {
                // Fetch innerText if file is empty (happens when we lose and regain focus to this key)
                payload[key] = elemFile.innerText;
            } else {
                // Set value on initial file selection
                elemFile.innerText = elem.value;
            }
        } else if (elem.classList.contains("sdList")) { // Dynamic dropdown
            var valueField = elem.getAttribute("sdValueField");
            payload[valueField] = elem.value;
        } else if (elem.classList.contains("sdHTML")) { // HTML element
            var valueField = elem.getAttribute("sdValueField");
            payload[valueField] = elem.innerHTML;
        } else { // Normal value
            payload[key] = elem.value;
        }
        console.log("Save: " + key + "<=" + payload[key]);
    });
    Utils.setSettingsToPlugin(websocket, uuid)(payload);
    console.log('[PI] setSettings', payload)
}

async function initConfiguration(oldSettings) {
    initExchangeList(oldSettings.exchange)

    for (const ex of exchangesList) {
        allPairs[ex.id] = await fetchPairs(ex.id)
    }

    const exch = oldSettings.exchange || exchangesList[0].id
    onExchangeChange(exch, oldSettings.pair || allPairs[exch][0], allPairs)
}

const websocketOnOpen = (registerEventName, uuid) => () => {
    var json = {
        event: registerEventName,
        uuid: uuid
    };
    websocket.send(JSON.stringify(json));

    // Notify the plugin that we are connected
    Utils.sendValueToPlugin(websocket, actionInfo, uuid)('propertyInspectorConnected', 'property_inspector');
};

function websocketOnMessage(evt) {
    // Received message from Stream Deck
    var jsonObj = JSON.parse(evt.data);

    console.log('[PI] ws event', jsonObj.event)
    switch (jsonObj.event) {
        case 'sendToPropertyInspector':
            loadConfiguration(jsonObj.payload)
            break;
        case 'didReceiveSettings':
            loadConfiguration(jsonObj.payload);
            break;
        case 'didReceiveGlobalSettings':
            loadConfiguration(jsonObj.payload);
            break;
        default:
            console.log("Unhandled websocketOnMessage: " + jsonObj.event);
            break;
    }
};

document.addEventListener('websocketCreate', function() {
    console.log("Websocket created!");

    Trader.init();
});