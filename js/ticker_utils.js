function repaint(canvas, icon, settings, titleParameters) {
    const canvasContext = canvas.getContext("2d")
    canvasContext.clearRect(0, 0, canvas.width, canvas.height);
    canvasContext.drawImage(icon, 0, 0, 80, 64);


    const fontSize = 26 //titleParameters.fontSize || 26;
    const fontFamily = "Arial" // "Comic Sans MS" // titleParameters.fontFamily || "Lato";
    canvasContext.font = `${fontSize}px ${fontFamily}`;
    canvasContext.textAlign = "left";
    canvasContext.fillStyle = (settings.textColor || "#ffffff");

    const oType = settings.ordertype === "market" ? 'mkt' : settings.ordertype
    canvasContext.fillStyle = settings.ordertype === "market" ? '#00FF00' : '#FF0000';
    canvasContext.fillText(oType, 90, 20);

    const orderDirection = settings['order-direction']
    canvasContext.fillStyle = orderDirection === "bid" ? '#00FF00' : '#FF0000';
    canvasContext.fillText(orderDirection, 90, 44);

    canvasContext.font = `bold ${fontSize}px ${fontFamily}`;
    canvasContext.textAlign = "left";
    canvasContext.fillStyle = (settings.textColor || "#ffffff");
    canvasContext.fillText(settings.size, 2, 94);

    canvasContext.font = `${fontSize}px ${fontFamily}`
    canvasContext.textAlign = "left";
    canvasContext.fillStyle = (settings.textColor || "#ffffff");
    canvasContext.fillText(settings.pair, 2, 120);
    return canvas
}

function refreshTile(websocket, context, settings, titleParameters) {
    console.log('refresh', settings.exchange)
    const tilecanvas = document.getElementById("ticker");
    const drawing = new Image();
    drawing.src = `images/${settings.exchange}@2x.png`; // can also be a remote URL e.g. http://
    drawing.onload = function() {
        const json = {
            "event": "setImage",
            "context": context,
            "payload": {
                "image": repaint(tilecanvas, drawing, settings, titleParameters).toDataURL(),
                "target": DestinationEnum.HARDWARE_AND_SOFTWARE
            }
        }

        websocket.send(JSON.stringify(json));
    };
}