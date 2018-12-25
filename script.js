var canvas = null;
var ctx = null;

var transform = {
    x: 0,
    y: 0,
    sx: 1,
    sy: 1,
};

var objs = [{
    x: 100,
    y: 100,
    draw: (obj, ctx) => {
        console.log('WOOP', obj.x, obj.y);
        ctx.fillStyle = 'red';
        ctx.fillRect(obj.x - 50, obj.y - 50, 100, 100);
    }
}];

function main() {
    canvas = document.getElementById('root');
    ctx = canvas.getContext('2d');
    ctx.save();

    canvas.addEventListener('mousemove', mouse);

    resize();
}

function resize() {
    ctx.restore();
    ctx.save();

    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let sc = (canvas.offsetWidth * canvas.height) / (canvas.offsetHeight * canvas.width);
    if (sc < 1) {
        transform = {
            x: 0,
            y: (1 - sc)*canvas.height*0.5,
            sx: 1,
            sy: sc,
        };
        ctx.translate(0, transform.y);
        ctx.scale(1, sc);
    } else if (sc > 1) {
        sc = 1/sc;
        transform = {
            x: (1 - sc)*canvas.width*0.5,
            y: 0,
            sx: sc,
            sy: 1,
        };
        ctx.translate(transform.x, 0);
        ctx.scale(sc, 1);
    }

    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.clip();

    draw();
}

function draw() {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i=0; i < objs.length; i++) {
        console.log("Drawing", objs[i].x, objs[i].y);
        objs[i].draw(objs[i], ctx, canvas);
    }
}

function mouse(e) {
    let rect = canvas.getBoundingClientRect();
    let sx = canvas.width / rect.width;
    let sy = canvas.height / rect.height;

    let mx = ((e.clientX - rect.left) * sx - transform.x) / transform.sx;
    let my = ((e.clientY - rect.top) * sy - transform.y) / transform.sy;

    objs[0].x = mx;
    objs[0].y = my;

    draw();
}

window.addEventListener('load', main);
window.addEventListener('resize', resize);
