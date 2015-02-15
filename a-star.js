/**
 * Created by admin on 14.02.2015.
 */


var rects = [
    {
        x: 200,
        y: -10,
        width: 60,
        height: 100
    },
    {
        x: 60,
        y: 100,
        width: 80,
        height: 30
    }
];

var start = { x: 100, y: 50 };
var end = { x: 340, y: 50 };

var nodes = [];
var arcs = [];

var margin = 9;

function pointsEqual(p1, p2) {
    return p1.x == p2.x && p1.y == p2.y;
}

function addNode(p1) {
    var existing = _.findWhere(nodes, { x: p1.x, y: p1.y });
    if (existing == null) {
        nodes.push(p1);
        return true;
    }
}

function addArc(p1, p2) {
    addNode(p1);
    addNode(p2);

    var d = Math.sqrt((p2.x - p1.x) * (p2.x - p1.x) + (p2.y - p1.y) * (p2.y - p1.y));
    var existing = _.find(arcs, function(arc) {
        return pointsEqual(arc.p1, p1) && pointsEqual(arc.p2, p2);
    });
    if (existing == null)
    {
        arcs.push({
            p1: p1,
            p2: p2,
            weight: d * 1.5
        })
    }
}

function nodeHits(node) {
    return _.find(rects, function(rect) {
        return node.x > rect.x && node.x < rect.x + rect.width &&
               node.y > rect.y && node.y < rect.y + rect.height;
    });
}

function xRelate(node, rect) {
    return node.x <= rect.x ? -1 : (node.x >= rect.x + rect.width ? 1 : 0);
}

function yRelate(node, rect) {
    return node.y <= rect.y ? -1 : (node.y >= rect.y + rect.height ? 1 : 0);
}

function relate(node, rect) {
    return {
        x: xRelate(node, rect),
        y: yRelate(node, rect)
    }
}

function arcHits(arc) {
    return _.find(rects, function(rect) {
        var r1 = relate(arc.p1, rect);
        var r2 = relate(arc.p2, rect);
        return (r1.x == 0 && r2.x == 0 && r1.y != r2.y) ||
               (r1.y == 0 && r2.y == 0 && r1.x != r2.x);
    });
}

function positionHeuristic(position, goal) {
    return distance(position, goal);
}

function distance(position, goal) {
    return Math.sqrt((position.x - goal.x) * (position.x - goal.x) + (position.y - goal.y) * (position.y - goal.y));
}

function calcCost(initial, p1, p2) {
    var hitPenalty = 5.0;
    var passingCost = 1.5;
    var insidePassingCost = 2.5;
    var hitEvade = 1.3;

    var p1h = nodeHits(p1);
    var p2h = nodeHits(p2);
    var ah = arcHits({ p1: p1, p2: p2 });

    var d = distance(p1, p2);

    if (!p1h && !p2h && !ah)
        return initial + d * passingCost;

    if (p1h && p2h)
        return initial + d * insidePassingCost;

    if (p2h || ah)
        return initial + d * hitPenalty;

    if (p1h && !p2h)
        return initial + d * hitEvade;

    return initial + d * passingCost;
}

function nextStates(state, goal) {

    var dx = goal.x - state.position.x;
    var dy = goal.x - state.position.y;

    var result = [];

    if (Math.abs(dx) > 0) {
        var nextDx = { x: goal.x, y: state.position.y };
        var dxHit = nodeHits(nextDx) || arcHits({ p1: state.position, p2: nextDx });

        result.push({
            position: nextDx,
            heuristic: positionHeuristic(nextDx, goal),
            cost: calcCost(state.cost, state.position, nextDx),
            previous: state
        });

        if (dxHit) {
            var dx1 = { x: dxHit.x + (dx < 0 ? dxHit.width : 0), y : state.position.y };

            if (state.position.x != dx1.x)
                result.push({
                    position: dx1,
                    heuristic: positionHeuristic(dx1, goal),
                    cost: calcCost(state.cost, state.position, dx1),
                    previous: state
                });
            else {
                var dx2 = { x: dxHit.x + (dx < 0 ? dxHit.width : 0), y: dxHit.y };
                result.push({
                    position: dx2,
                    heuristic: positionHeuristic(dx2, goal),
                    cost: calcCost(state.cost, state.position, dx2),
                    previous: state
                });
                var dx3 = { x: dxHit.x + (dx < 0 ? dxHit.width : 0), y: dxHit.y + dxHit.height };
                result.push({
                    position: dx3,
                    heuristic: positionHeuristic(dx3, goal),
                    cost: calcCost(state.cost, state.position, dx3),
                    previous: state
                });
            }

        }
    }

    if (Math.abs(dy) > 0) {
        var nextDy = { x: state.position.x, y: goal.y };
        var dyHit = nodeHits(nextDy) || arcHits({ p1: state.position, p2: nextDy });

        result.push({
            position: nextDy,
            heuristic: positionHeuristic(nextDy, goal),
            cost: calcCost(state.cost, state.position, nextDy),
            previous: state
        });

        if (dyHit) {
            var dy1 = { x: state.position.x, y : dyHit.y + (dy < 0 ? dyHit.height : 0)};

            if (dy1.y != state.position.y) {
                result.push({
                    position: dy1,
                    heuristic: positionHeuristic(dy1, goal),
                    cost: calcCost(state.cost, state.position, dy1),
                    previous: state
                });
            }

            var dy2 = { x: dyHit.x, y: state.position.y };
            result.push({
                position: dy2,
                heuristic: positionHeuristic(dy2, goal),
                cost: calcCost(state.cost, state.position, dy2),
                previous: state
            });
            var dy3 = { x: dyHit.x + dyHit.width, y: state.position.y };
            result.push({
                position: dy3,
                heuristic: positionHeuristic(dy3, goal),
                cost: calcCost(state.cost, state.position, dy3),
                previous: state
            });
        }
    }

    return result;
}

function fringePopper(fringe) {
    var min = _.sortBy(fringe, function(state) {
        return state.cost + state.heuristic;
    })[0];

    fringe.splice(fringe.indexOf(min), 1);

    return min;
}

function positionOnStateList(states, position) {
    return _.any(states, function(state) { return state.position.x == position.x && state.position.y == position.y; });
}

function graphSearch(p1, p2) {
    var closed = [];
    var fringe = [];

    fringe.push({
        position: p1,
        heuristic: positionHeuristic(p1, p2),
        cost: 0.0,
        previous: null
    });

    var next;
    var success = false;

    while (true) {
        if (fringe.length == 0) break;
        next = fringePopper(fringe);

        if (goalTest(next)) {
            success = true;
            break;
        }

        if (positionOnStateList(closed, next.position))
            continue;

        closed.push(next);

        var children = nextStates(next, p2);
        fringe = _.union(fringe, children);
    }

    if (success) {
        while (next.previous != null) {
            arcs.push({p1: next.position, p2: next.previous.position, cost: next.cost - next.previous.cost });
            next = next.previous;
        }
    }
}

function goalTest(state) {
    return (state.position.x == end.x) && (state.position.y == end.y);
}