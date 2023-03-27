export const createCircle = (x: number, y: number, r: number, color: string) => {
    var c = document.createElement("canvas");
    var ctx = c.getContext("2d");
    if (ctx !== null) {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
    }
    return c;
}

export const createRectRound = (x: number, y: number, w: number, h: number, r: number, color: string) => {
    var c = document.createElement("canvas");
    var ctx = c.getContext("2d");
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    if (ctx !== null) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.fillStyle = color;
        ctx.fill();
    }
    return c;
}