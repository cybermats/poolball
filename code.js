'use strict';

var running = 4;
var epsilon = 1e-2;

function Vec(x, y) {
  this.x = x;
  this.y = y;
  this.length = function() {
    return Math.sqrt(x*x + y*y);
  }
  this.add = function(vec) {
    return new Vec(this.x + vec.x, this.y + vec.y);
  }
  this.sub = function(vec) {
    return new Vec(this.x - vec.x, this.y - vec.y);
  }
  this.scale = function(s) {
    return new Vec(this.x * s, this.y * s);
  }
  this.dot = function(vec) {
    return this.x * vec.x + this.y * vec.y;
  }
  this.ortho = function() {
    return new Vec(-this.y, this.x);
  }
  this.normalize = function() {
    let len = this.length();
    return new Vec(this.x / len, this.y / len);
  }
}

function Ball(size, path) {
  this.size = size;
  this.path = path;
  this.type = 'ball';
  this.color = 'black';

  this.paint = function(ctx, t) {
    let pos = this.path.getPosition(t);
    ctx.save();
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, this.size, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    let begin = this.path.origin;
    let end = this.path.getEndPosition();

    ctx.save();
    ctx.beginPath();
    ctx.arc(begin.x, begin.y, this.size, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(end.x, end.y, this.size, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.stroke();

    ctx.setLineDash([10]);
    ctx.beginPath();
    ctx.moveTo(begin.x, begin.y);
    ctx.lineTo(end.x, end.y);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  this.update = function(t) {
    if (this.path.isMoving(t)) {
      return;
    }
    console.log('update');

    let origin_new = this.path.getEndPosition();
    let velocity_old = this.path.velocity;
    let start = this.path.start + this.path.duration;

    if (this.path.intersect.type == 'wall') {
      let n = this.path.intersect.normal;
      let velocity_new = velocity_old.sub(
        n.scale(velocity_old.dot(n) * 2)
      );
      origin_new = origin_new.add(velocity_new.scale(epsilon));
      intersectScene(origin_new, velocity_new, this, start);
    }
    else if (this.path.intersect.type == 'ball' ) {
      let that = this.path.intersect;
      console.log('this moving', this.path.isMoving(t));
      console.log('that moving', that.path.isMoving(t));
      let ball2_pos = that.path.getPosition(start);

      let un = ball2_pos.sub(origin_new).normalize();
      let ut = un.ortho();
      let v1 = velocity_old;
      let v2 = that.path.velocity;
      let m1 = this.size;
      let m2 = that.size;

      let v1n = un.dot(v1);
      let v1t = ut.dot(v1);
      let v2n = un.dot(v2);
      let v2t = ut.dot(v2);


      let v1tp = v1t;
      let v2tp = v2t;

      let v1np = (v1n * (m1 - m2) + 2 * m2 * v2n) / (m1 + m2);
      let v2np = (v2n * (m2 - m1) + 2 * m1 * v1n) / (m1 + m2);

      let v1p = un.scale(v1np).add(ut.scale(v1tp));
      let v2p = un.scale(v2np).add(ut.scale(v2tp));

      origin_new = origin_new.add(v1p.scale(epsilon));

      intersectScene(origin_new, v1p, this, start);

      console.log('this.path', this.index, this.path);

      ball2_pos = ball2_pos.add(v2p.scale(epsilon));

      intersectScene(ball2_pos, v2p, that, start);

      console.log('that.path', that.index, that.path);
      console.log('this moving', this.path.isMoving(t));
      console.log('that moving', that.path.isMoving(t));
    }

    running--;
  }
}

function Path(origin, velocity, start, duration, intersection) {
  this.origin = origin;
  this.velocity = velocity;
  this.start = start;
  this.duration = duration;
  this.intersect = intersection;

  this.getPosition = function(t) {
    let diff = Math.min(t - this.start, this.duration);
    return this.origin.add(velocity.scale(diff));
  }

  this.getEndPosition = function() {
    return this.origin.add(this.velocity.scale(this.duration));
  }

  this.isMoving = function(t) {
    return (t < (this.duration + this.start));
  }
}

function Wall(origin, normal) {
  this.origin = origin;
  this.normal = normal.normalize();
  this.type = 'wall';

  let dir = normal.ortho();
  let invdirx = 1/dir.x;
  let invdiry = 1/dir.y;

  let tmin, tmax;
  if (invdirx >= 0) {
    tmin = (0 - this.origin.x) * invdirx;
    tmax = (state.canvas.width - this.origin.x) * invdirx;
  }
  else {
    tmin = (state.canvas.width - this.origin.x) * invdirx;
    tmax = (0 - this.origin.x) * invdirx;
  }

  let tymin, tymax;
  if (invdiry >= 0) {
    tymin = (0 - this.origin.y) * invdiry;
    tymax = (state.canvas.height - this.origin.y) * invdiry;
  }
  else {
    tymin = (state.canvas.height - this.origin.y) * invdiry;
    tymax = (0 - this.origin.y) * invdiry;
  }

  if (tymin > tmin) {
    tmin = tymin;
  }
  if (tymax < tmax) {
    tmax = tymax;
  }

  this.p0 = this.origin.add(dir.scale(tmin));
  this.p1 = this.origin.add(dir.scale(tmax));

  this.paint = function(ctx, t) {
    /*
    ctx.beginPath();
    ctx.setLineDash([]);
    ctx.moveTo(this.p0.x, this.p0.y);
    ctx.lineTo(this.p1.x, this.p1.y);
    ctx.closePath();
    ctx.stroke();
    */
  }
  this.update = function(t) {

  }
}

var scene = [];
var state = {};


function intersectWall(origin, direction, ball, wall) {
  let denom = wall.normal.dot(direction);
  if (Math.abs(denom) > 1e-6) {
    let p0l0 = wall.origin.sub(origin);
    let t = p0l0.dot(wall.normal) / denom;
    return t + (ball.size / denom);
  }
  return -1;
}

function intersectBall(origin, velocity, ball1, ball2) {
//  running--;
  let l = ball1.size + ball2.size;
  let pq = origin.sub(ball2.path.origin);
  let rs = velocity.sub(ball2.path.velocity);
  let a = rs.dot(rs);
  if (a < 1e-6 && a > -1e-6) {
    return -1;
  }
  let b = 2 * rs.dot(pq);
  let c = pq.dot(pq) - l*l;

  let square = b*b - 4*a*c;
  if (square < 0) {
    return -1;
  }

  if (square < 1e-6) {
    return (-b / (2*a)) * velocity.length();
  }
  let sqr = Math.sqrt(square);
  let t1 = (-b + sqr) / (2 * a) * velocity.length();
  let t2 = (-b - sqr) / (2 * a) * velocity.length();

  let tmin = Math.min(t1, t2);
  let tmax = Math.max(t1, t2);

  if (tmin < 0) {
    return tmax;
  } else {
    return tmin;
  }
}

function intersectScene(origin, velocity, obj, start) {
  let dir = velocity.normalize();
  let ts = scene.map(function(el, idx) {
    if (idx == obj.index) {
      return -1;
    }
    if (el.type == 'wall') {
      return intersectWall(origin, dir, obj, el);
    }
    else if (el.type == 'ball') {
      let t =  intersectBall(origin, velocity, obj, el);
      return t;
    }
    else {
      console.error('unknown type');
    }

  });
  let tmin = ts.reduce(function(acc, el, idx) {
    if ((el > 0) && (el < acc[0])) {
      return [el, idx];
    }
    return acc;
  }, [Infinity, -1]);
  console.log('tmin', tmin);
  let duration = tmin[0] / velocity.length();
  let intersection = scene[tmin[1]];
  obj.path = new Path(origin, velocity,
    start, duration, intersection);

//  return;
  if (intersection.type == 'ball') {
//    console.log(intersection);
//    let other_duration = (start + duration) - intersection.path.start;
//    intersection.path.duration = other_duration;
  }
}

function getTime() {
  return new Date().valueOf() / 100;
}

function draw() {
  let now = getTime();
  state.ctx.clearRect(0, 0, state.canvas.width, state.canvas.height);
  scene.forEach(e => e.update(now));
  scene.forEach(e => e.paint(state.ctx, now));

  if (running > 0) {
    window.requestAnimationFrame(draw);
  } else {
    console.log('running', running);
  }
}

function onInit() {
  let now = getTime();

  state.canvas = document.getElementById('canvas');
  state.ctx = canvas.getContext('2d');

  scene.push(new Wall(new Vec(0, 0), new Vec(1, 0)));
  scene.push(new Wall(new Vec(0, 0), new Vec(0, 1)));
  scene.push(new Wall(new Vec(state.canvas.width, state.canvas.height), new Vec(0, -1)));
  scene.push(new Wall(new Vec(state.canvas.width, state.canvas.height), new Vec(-1, 0)));

  let radiusa = 10;
  let balla = new Ball(radiusa, null);
  balla.color = 'red';
  scene.push(balla);

  scene.forEach((e, i) => e.index = i);

  let origina = new Vec(50, 150);
  let velocitya = new Vec(10, 0);
  let tmina = intersectScene(origina, velocitya, balla, now);

  let radiusb = 10;
  let ballb = new Ball(radiusb, null);
  ballb.color = 'blue';
  scene.push(ballb);

  scene.forEach((e, i) => e.index = i);
  let originb = new Vec(150, 50);
  let velocityb = new Vec(0, 10);
  let tminb = intersectScene(originb, velocityb, ballb, now);

  window.requestAnimationFrame(draw);
}
