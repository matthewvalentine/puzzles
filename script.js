var canvas = null;
var ctx = null;

var transform = {
    x: 0,
    y: 0,
    sx: 1,
    sy: 1,
};

var shiftOn = false;
var mousePos = {x: 0, y: 0}

var state = {
    oldRope: [{x: 0, y: 600}, {x: 0, y: 600}, {x: 0, y: 600}],
    rope: [{x: 0, y: 600}, {x: 0, y: 600}, {x: 0, y: 600}],
    pegs: [{x: 200, y: 200}, {x: 600, y: 200}],
    mode: INIT,
};

var original = state;
var reset = original;

var INIT = 1;
var PULL = 2;
var DEPEG = 3;
var FALL = 4;

function pull(x, y) {
    state = {...original, mode: PULL, rope: [{x, y}, {x, y}]};
}

function twoPegs() {
    let pegs = [{x: 200, y: 200}, {x: 600, y: 200}];
    state = reset = original = {...original, pegs};
}

function threePegs() {
    let pegs = [{x: 150, y: 200}, {x: 400, y: 250}, {x: 650, y: 200}];
    state = reset = original = {...original, pegs};
}

function stopPull() {
    let {rope} = state;
    let x = rope[0].x;
    let y = rope[0].y;
    let last = rope[rope.length-1];
    let dx = x - last.x;
    let dy = y - last.y;
    let n = ~~(Math.sqrt(dx*dx + dy*dy)/ropesize);
    if (n < 1) {
        return;
    }
    let newRope = rope.slice();
    let oldRope = state.oldRope.slice();
    for (let i=0; i<n; i++) {
        newRope.push({x: last.x+i*dx/n, y: last.y+i*dy/n});
        oldRope.push({x: last.x+i*dx/n, y: last.y+i*dy/n});
        state = {...state, oldRope, rope: newRope};
    }
    state = {...state, mode: FALL};
    reset = state;
}

function space() {
    if (state.mode === PULL) {
        stopPull();
    } else if (state.mode > PULL) {
        state = reset;
    } else {
        stopPull();
    }
}

function clickPeg(i) {
    if (state.mode === PULL) {
        return
    } else {
        reset = state;
        let {pegs} = state;
        let newPegs = pegs.slice();
        newPegs.splice(i, 1);
        state = {...state, pegs: newPegs};
    }
}

function clickMouse(x, y) {
    let pegs = state.pegs;
    for (let i =0; i < pegs.length; i++) {
        let dx = pegs[i].x - x;
        let dy = pegs[i].y - y;
        if (dx*dx + dy*dy < pegsize2) {
            clickPeg(i);
            return;
        }
    }
    if (state.mode === PULL) {
        stopPull();
    } else {
        pull(x, y);
    }
}

function moveMouse(x, y) {
    let {mode, rope} = state;
    if (mode !== PULL) {
        return;
    }
    let last = rope[rope.length-1];
    let dx = x - last.x;
    let dy = y - last.y;
    let n = ~~(Math.sqrt(dx*dx + dy*dy)/ropesize);
    if (n < 1) {
        return;
    }
    let newRope = rope.slice();
    let oldRope = state.oldRope.slice();
    for (let i=0; i <n; i++) {
        newRope.push({x: last.x+i*dx/n, y: last.y+i*dy/n});
        oldRope.push({x: last.x+i*dx/n, y: last.y+i*dy/n});
        state = {...state, oldRope, rope: newRope};
    }
}

function consume() {
    for (let j=0; j<30; j++) {
        let {rope} = state;
        if (rope.length <= 1000) {
            return;
        }
        let lowest = 0;
        for (let i=0; i<rope.length; i++) {
            if (rope[i].y > rope[lowest].y) {
                lowest = i;
            }
        }
        let newRope = rope.slice();
        newRope.splice(lowest, 1);
        let oldRope = state.oldRope.slice();
        oldRope.splice(lowest, 1);
        state = {...state, rope: newRope, oldRope};
    }
}

window.addEventListener('load', main);

function onmousemove(e, cont) {
    let rect = canvas.getBoundingClientRect();
    let sx = canvas.width / rect.width;
    let sy = canvas.height / rect.height;

    let mx = ((e.clientX - rect.left) * sx - transform.x) / transform.sx;
    let my = ((e.clientY - rect.top) * sy - transform.y) / transform.sy;

    cont(mx, my);
}

function onkeyup(e) {
    if (e.keyCode === 32) {
        space();
    } else if (e.keyCode === 50) {
        twoPegs();
    } else if (e.keyCode === 51) {
        threePegs();
    } else if (e.keyCode === 16) {
        shiftOn = false;
    }
}

function onkeydown(e) {
    if (e.keyCode === 16) {
        shiftOn = true;
    }
}

function main() {
    canvas = document.getElementById('root');
    ctx = canvas.getContext('2d');
    ctx.save();

    window.addEventListener('mousemove', e => onmousemove(e, moveMouse));
    window.addEventListener('click', e => onmousemove(e, clickMouse));
    window.addEventListener('keyup', onkeyup);
    window.addEventListener('keydown', onkeydown);
    window.addEventListener('resize', resize);

    resize();
    requestAnimationFrame(loop);
}

function loop() {
    requestAnimationFrame(loop);
    if (state.mode > PULL) {
        simtick();
    }
    draw();
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
    let {pegs, rope} = state;

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = "20px Arial";
    ctx.fillStyle = "black";
    ctx.fillText("Goal: Wrap string so that removing either peg allows string to fall.", 0, 560);
    ctx.fillText("Click: Draw string, remove peg. Space: Reset. Shift: Tighten. 2/3: Choose level.", 0, 590);

    ctx.fillStyle = 'blue';
    for (let i=0; i<pegs.length; i++){
        ctx.beginPath();
        ctx.arc(pegs[i].x, pegs[i].y, pegsize, 0, 2*Math.PI);
        ctx.fill();
    }

    if (state.mode !== INIT) {
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 4;
        ctx.beginPath();
        for (let i=0; i < rope.length; i++) {
            ctx.lineTo(rope[i].x, rope[i].y);
        }
        if (state.mode > FALL) {
            ctx.closePath();
        }
        ctx.stroke();
    }
}

function simtick() {
    if (shiftOn) {
        consume();
    }
    integrate();
    for (let i=0; i<iters; i++) {
        constrain();
    }
}

function update(c, o) {
    if (state.mode > PULL) {
        return {
            x: c.x + keep*(c.x - o.x),
            y: c.y + keep*(c.y - o.y) + grav,
        };
    } else {
        return {
            x: c.x + keep*(c.x - o.x),
            y: c.y + keep*(c.y - o.y) + lowgrav,
        };
    }
}

function integrate() {
    let {rope, oldRope} = state;
    let newRope = [];
    let i = 0;
    if (state.mode <= FALL) {
        newRope.push({...rope[0]});
        i = 1;
    }
    for (; i < rope.length; i++) {
        newRope.push(update(rope[i], oldRope[i]));
    }
    state = {
        ...state,
        oldRope: rope,
        rope: newRope,
    };
}

function ropenodes(a, b) {
    let d2 = dist2(a, b);
    if (d2 <= ropesize2) {
        return;
    }
    let d = Math.sqrt(d2);
    let diff = d - ropesize;
    let dx = a.x - b.x;
    let dy = a.y - b.y;
    let ddx = 0.5 * dx * diff / d;
    let ddy = 0.5 * dy * diff / d;
    a.x -= ddx;
    a.y -= ddy;
    b.x += ddx;
    b.y += ddy;
}

function constrain() {
    let {rope, pegs} = state;

    let end = state.mode > PULL ? 0 : 1;
    for (let i=rope.length-1; i > end; i--) {
        ropenodes(rope[i], rope[i-1]);
    }
    if (state.mode > PULL) {
        ropenodes(rope[0], rope[rope.length-1]);
    }

    for (let i=0; i < rope.length; i++) {
        for (let j=0; j < pegs.length; j++) {
            let d2 = dist2(rope[i], pegs[j]);
            if (d2 >= pegsize2) {
                continue;
            }
            dx = rope[i].x - pegs[j].x;
            dy = rope[i].y - pegs[j].y;
            d = Math.sqrt(d2);
            rope[i].x = pegs[j].x + pegsize * dx / d;
            rope[i].y = pegs[j].y + pegsize * dy / d;
        }
    }
}

function dist2(a, b) {
    let x = a.x - b.x;
    let y = a.y - b.y;
    return x*x + y*y;
}

var iters = 100;
var grav = 0.3;
var lowgrav = 0;
var keep = 0.99;

var pegsize = 70;
var pegsize2 = pegsize * pegsize;

var ropesize = 1;
var ropesize2 = ropesize * ropesize;

