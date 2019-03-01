
var running = 2;

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
    return new Vec(this.y, -this.x);
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
  this.paint = function(ctx, t) {
    let pos = this.path.getPosition(t);
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, this.size, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fill();
/*
    let begin = this.path.origin;
    let end = this.path.getEndPosition();
    ctx.beginPath();
    ctx.setLineDash([5]);
    ctx.moveTo(begin.x, begin.y);
    ctx.lineTo(end.x, end.y);
    ctx.closePath();
    ctx.stroke();
    */
  }

  this.update = function(t) {
    if (this.path.isMoving(t)) {
      return;
    }
    let porig = this.path.getEndPosition();
    let vel = this.path.velocity;
    let n = this.path.intersect.obj.normal;
    let pvel = vel.sub(
      n.scale(vel.dot(n) * 2)
    );
    let tmin = intersectScene(porig, pvel, this.index);
    let duration = (tmin[0] - this.size) / pvel.length();
    let intersection = scene[tmin[1]];
    let start = this.path.start + this.path.duration;
    this.path = new Path(porig, pvel, start, duration, intersection);

//    running--;
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
    return ((t - this.start) < this.duration);
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


function intersectWall(origin, direction, wall) {
  let denom = wall.normal.dot(direction);
  if (Math.abs(denom) > 1e-6) {
    let p0l0 = wall.origin.sub(origin);
    let t = p0l0.dot(wall.normal) / denom;
    return t;
  }
  return -1;
}

function intersectScene(origin, velocity, item) {
  let dir = velocity.normalize();
  let ts = scene.map(function(el, idx) {
    if (idx == item) {
      return -1;
    }
    return intersectWall(origin, dir, el.obj);
  });
  let tmin = ts.reduce(function(acc, el, idx) {
    if ((el > 0) && (el < acc[0])) {
      return [el, idx];
    }
    return acc;
  }, [Infinity, -1]);
  return tmin;
}

function getTime() {
  return new Date().valueOf() / 100;
}

function draw() {
  let now = getTime();
  state.ctx.clearRect(0, 0, state.canvas.width, state.canvas.height);
  scene.filter(o => o.visible)
    .forEach(e => e.obj.paint(state.ctx, now));
  scene.forEach(e => e.obj.update(now));

  window.requestAnimationFrame(draw);
}

function onInit() {
  let now = getTime();

  state.canvas = document.getElementById('canvas');
  state.ctx = canvas.getContext('2d');

  scene.push({
    obj: new Wall(new Vec(0, 0), new Vec(1, 0)),
    visible: true
  });
  scene.push({
    obj: new Wall(new Vec(0, 0), new Vec(0, 1)),
    visible: true
  });
  scene.push({
    obj: new Wall(new Vec(state.canvas.width, state.canvas.height), new Vec(0, -1)),
    visible: true
  });
  scene.push({
    obj: new Wall(new Vec(state.canvas.width, state.canvas.height), new Vec(-1, 0)),
    visible: true
  });

  let borig = new Vec(50, 50);
  let bdest = new Vec(20, 40);
  let radius = 10;
  let tmin = intersectScene(borig, bdest);
  let duration = (tmin[0] - radius) / bdest.length();
  let intersection = scene[tmin[1]];
  scene.push({
    obj: new Ball(radius,
      new Path(borig, bdest, now, duration, intersection)),
    visible: true
  });
  scene.forEach((e, i) => e.obj.index = i);
  window.requestAnimationFrame(draw);
}
