!(function(e) {
    if ("object" == typeof exports && "undefined" != typeof module)
        module.exports = e();
    else if ("function" == typeof define && define.amd) define([], e);
    else {
        var n;
        "undefined" != typeof window
            ? (n = window)
            : "undefined" != typeof global
              ? (n = global)
              : "undefined" != typeof self && (n = self),
            (n.geojsonExtent = e());
    }
})(function() {
    return (function e(t, n, r) {
        function s(o, u) {
            if (!n[o]) {
                if (!t[o]) {
                    var a = "function" == typeof require && require;
                    if (!u && a) return a(o, !0);
                    if (i) return i(o, !0);
                    var f = new Error("Cannot find module '" + o + "'");
                    throw ((f.code = "MODULE_NOT_FOUND"), f);
                }
                var l = (n[o] = { exports: {} });
                t[o][0].call(
                    l.exports,
                    function(e) {
                        var n = t[o][1][e];
                        return s(n ? n : e);
                    },
                    l,
                    l.exports,
                    e,
                    t,
                    n,
                    r
                );
            }
            return n[o].exports;
        }
        for (
            var i = "function" == typeof require && require, o = 0;
            o < r.length;
            o++
        )
            s(r[o]);
        return s;
    })(
        {
            1: [
                function(require, module) {
                    function getExtent(_) {
                        for (
                            var ext = extent(),
                                coords = geojsonCoords(_),
                                i = 0;
                            i < coords.length;
                            i++
                        )
                            ext.include(coords[i]);
                        return ext;
                    }
                    var geojsonCoords = require("geojson-coords"),
                        traverse = require("traverse"),
                        extent = require("extent");
                    (module.exports = function(_) {
                        return getExtent(_).bbox();
                    }),
                        (module.exports.polygon = function(_) {
                            return getExtent(_).polygon();
                        }),
                        (module.exports.bboxify = function(_) {
                            return traverse(_).map(function(value) {
                                value &&
                                    "string" == typeof value.type &&
                                    ((value.bbox = getExtent(value).bbox()),
                                    this.update(value));
                            });
                        });
                },
                { extent: 2, "geojson-coords": 4, traverse: 7 }
            ],
            2: [
                function(require, module) {
                    function Extent() {
                        return this instanceof Extent
                            ? ((this._bbox = [1 / 0, 1 / 0, -1 / 0, -1 / 0]),
                              void (this._valid = !1))
                            : new Extent();
                    }
                    (module.exports = Extent),
                        (Extent.prototype.include = function(ll) {
                            return (
                                (this._valid = !0),
                                (this._bbox[0] = Math.min(
                                    this._bbox[0],
                                    ll[0]
                                )),
                                (this._bbox[1] = Math.min(
                                    this._bbox[1],
                                    ll[1]
                                )),
                                (this._bbox[2] = Math.max(
                                    this._bbox[2],
                                    ll[0]
                                )),
                                (this._bbox[3] = Math.max(
                                    this._bbox[3],
                                    ll[1]
                                )),
                                this
                            );
                        }),
                        (Extent.prototype.union = function(other) {
                            return (
                                (this._valid = !0),
                                (this._bbox[0] = Math.min(
                                    this._bbox[0],
                                    other[0]
                                )),
                                (this._bbox[1] = Math.min(
                                    this._bbox[1],
                                    other[1]
                                )),
                                (this._bbox[2] = Math.max(
                                    this._bbox[2],
                                    other[2]
                                )),
                                (this._bbox[3] = Math.max(
                                    this._bbox[3],
                                    other[3]
                                )),
                                this
                            );
                        }),
                        (Extent.prototype.bbox = function() {
                            return this._valid ? this._bbox : null;
                        }),
                        (Extent.prototype.contains = function(ll) {
                            return this._valid
                                ? this._bbox[0] <= ll[0] &&
                                      this._bbox[1] <= ll[1] &&
                                      this._bbox[2] >= ll[0] &&
                                      this._bbox[3] >= ll[1]
                                : null;
                        }),
                        (Extent.prototype.polygon = function() {
                            return this._valid
                                ? {
                                      type: "Polygon",
                                      coordinates: [
                                          [
                                              [this._bbox[0], this._bbox[1]],
                                              [this._bbox[2], this._bbox[1]],
                                              [this._bbox[2], this._bbox[3]],
                                              [this._bbox[0], this._bbox[3]],
                                              [this._bbox[0], this._bbox[1]]
                                          ]
                                      ]
                                  }
                                : null;
                        });
                },
                {}
            ],
            3: [
                function(require, module) {
                    module.exports = function(list) {
                        function _flatten(list) {
                            return Array.isArray(list) &&
                                list.length &&
                                "number" == typeof list[0]
                                ? [list]
                                : list.reduce(function(acc, item) {
                                      return Array.isArray(item) &&
                                          Array.isArray(item[0])
                                          ? acc.concat(_flatten(item))
                                          : (acc.push(item), acc);
                                  }, []);
                        }
                        return _flatten(list);
                    };
                },
                {}
            ],
            4: [
                function(require, module) {
                    var geojsonNormalize = require("geojson-normalize"),
                        geojsonFlatten = require("geojson-flatten"),
                        flatten = require("./flatten");
                    module.exports = function(_) {
                        if (!_) return [];
                        var normalized = geojsonFlatten(geojsonNormalize(_)),
                            coordinates = [];
                        return (
                            normalized.features.forEach(function(feature) {
                                feature.geometry &&
                                    (coordinates = coordinates.concat(
                                        flatten(feature.geometry.coordinates)
                                    ));
                            }),
                            coordinates
                        );
                    };
                },
                { "./flatten": 3, "geojson-flatten": 5, "geojson-normalize": 6 }
            ],
            5: [
                function(require, module) {
                    function flatten(gj) {
                        switch ((gj && gj.type) || null) {
                            case "FeatureCollection":
                                return (
                                    (gj.features = gj.features.reduce(function(
                                        mem,
                                        feature
                                    ) {
                                        return mem.concat(flatten(feature));
                                    },
                                    [])),
                                    gj
                                );
                            case "Feature":
                                return flatten(gj.geometry).map(function(geom) {
                                    return {
                                        type: "Feature",
                                        properties: JSON.parse(
                                            JSON.stringify(gj.properties)
                                        ),
                                        geometry: geom
                                    };
                                });
                            case "MultiPoint":
                                return gj.coordinates.map(function(_) {
                                    return { type: "Point", coordinates: _ };
                                });
                            case "MultiPolygon":
                                return gj.coordinates.map(function(_) {
                                    return { type: "Polygon", coordinates: _ };
                                });
                            case "MultiLineString":
                                return gj.coordinates.map(function(_) {
                                    return {
                                        type: "LineString",
                                        coordinates: _
                                    };
                                });
                            case "GeometryCollection":
                                return gj.geometries;
                            case "Point":
                            case "Polygon":
                            case "LineString":
                                return [gj];
                            default:
                                return gj;
                        }
                    }
                    module.exports = flatten;
                },
                {}
            ],
            6: [
                function(require, module) {
                    function normalize(gj) {
                        if (!gj || !gj.type) return null;
                        var type = types[gj.type];
                        return type
                            ? "geometry" === type
                              ? {
                                    type: "FeatureCollection",
                                    features: [
                                        {
                                            type: "Feature",
                                            properties: {},
                                            geometry: gj
                                        }
                                    ]
                                }
                              : "feature" === type
                                ? { type: "FeatureCollection", features: [gj] }
                                : "featurecollection" === type ? gj : void 0
                            : null;
                    }
                    module.exports = normalize;
                    var types = {
                        Point: "geometry",
                        MultiPoint: "geometry",
                        LineString: "geometry",
                        MultiLineString: "geometry",
                        Polygon: "geometry",
                        MultiPolygon: "geometry",
                        GeometryCollection: "geometry",
                        Feature: "feature",
                        FeatureCollection: "featurecollection"
                    };
                },
                {}
            ],
            7: [
                function(require, module) {
                    function Traverse(obj) {
                        this.value = obj;
                    }
                    function walk(root, cb, immutable) {
                        var path = [],
                            parents = [],
                            alive = !0;
                        return (function walker(node_) {
                            function updateState() {
                                if (
                                    "object" == typeof state.node &&
                                    null !== state.node
                                ) {
                                    (state.keys &&
                                        state.node_ === state.node) ||
                                        (state.keys = objectKeys(state.node)),
                                        (state.isLeaf = 0 == state.keys.length);
                                    for (var i = 0; i < parents.length; i++)
                                        if (parents[i].node_ === node_) {
                                            state.circular = parents[i];
                                            break;
                                        }
                                } else (state.isLeaf = !0), (state.keys = null);
                                (state.notLeaf = !state.isLeaf),
                                    (state.notRoot = !state.isRoot);
                            }
                            var node = immutable ? copy(node_) : node_,
                                modifiers = {},
                                keepGoing = !0,
                                state = {
                                    node: node,
                                    node_: node_,
                                    path: [].concat(path),
                                    parent: parents[parents.length - 1],
                                    parents: parents,
                                    key: path.slice(-1)[0],
                                    isRoot: 0 === path.length,
                                    level: path.length,
                                    circular: null,
                                    update: function(x, stopHere) {
                                        state.isRoot ||
                                            (state.parent.node[state.key] = x),
                                            (state.node = x),
                                            stopHere && (keepGoing = !1);
                                    },
                                    delete: function(stopHere) {
                                        delete state.parent.node[state.key],
                                            stopHere && (keepGoing = !1);
                                    },
                                    remove: function(stopHere) {
                                        isArray(state.parent.node)
                                            ? state.parent.node.splice(
                                                  state.key,
                                                  1
                                              )
                                            : delete state.parent.node[
                                                  state.key
                                              ],
                                            stopHere && (keepGoing = !1);
                                    },
                                    keys: null,
                                    before: function(f) {
                                        modifiers.before = f;
                                    },
                                    after: function(f) {
                                        modifiers.after = f;
                                    },
                                    pre: function(f) {
                                        modifiers.pre = f;
                                    },
                                    post: function(f) {
                                        modifiers.post = f;
                                    },
                                    stop: function() {
                                        alive = !1;
                                    },
                                    block: function() {
                                        keepGoing = !1;
                                    }
                                };
                            if (!alive) return state;
                            updateState();
                            var ret = cb.call(state, state.node);
                            return (
                                void 0 !== ret &&
                                    state.update &&
                                    state.update(ret),
                                modifiers.before &&
                                    modifiers.before.call(state, state.node),
                                keepGoing
                                    ? ("object" != typeof state.node ||
                                          null === state.node ||
                                          state.circular ||
                                          (parents.push(state),
                                          updateState(),
                                          forEach(state.keys, function(key, i) {
                                              path.push(key),
                                                  modifiers.pre &&
                                                      modifiers.pre.call(
                                                          state,
                                                          state.node[key],
                                                          key
                                                      );
                                              var child = walker(
                                                  state.node[key]
                                              );
                                              immutable &&
                                                  hasOwnProperty.call(
                                                      state.node,
                                                      key
                                                  ) &&
                                                  (state.node[key] =
                                                      child.node),
                                                  (child.isLast =
                                                      i ==
                                                      state.keys.length - 1),
                                                  (child.isFirst = 0 == i),
                                                  modifiers.post &&
                                                      modifiers.post.call(
                                                          state,
                                                          child
                                                      ),
                                                  path.pop();
                                          }),
                                          parents.pop()),
                                      modifiers.after &&
                                          modifiers.after.call(
                                              state,
                                              state.node
                                          ),
                                      state)
                                    : state
                            );
                        })(root).node;
                    }
                    function copy(src) {
                        if ("object" == typeof src && null !== src) {
                            var dst;
                            if (isArray(src)) dst = [];
                            else if (isDate(src))
                                dst = new Date(
                                    src.getTime ? src.getTime() : src
                                );
                            else if (isRegExp(src)) dst = new RegExp(src);
                            else if (isError(src))
                                dst = { message: src.message };
                            else if (isBoolean(src)) dst = new Boolean(src);
                            else if (isNumber(src)) dst = new Number(src);
                            else if (isString(src)) dst = new String(src);
                            else if (Object.create && Object.getPrototypeOf)
                                dst = Object.create(Object.getPrototypeOf(src));
                            else if (src.constructor === Object) dst = {};
                            else {
                                var proto =
                                        (src.constructor &&
                                            src.constructor.prototype) ||
                                        src.__proto__ ||
                                        {},
                                    T = function() {};
                                (T.prototype = proto), (dst = new T());
                            }
                            return (
                                forEach(objectKeys(src), function(key) {
                                    dst[key] = src[key];
                                }),
                                dst
                            );
                        }
                        return src;
                    }
                    function toS(obj) {
                        return Object.prototype.toString.call(obj);
                    }
                    function isDate(obj) {
                        return "[object Date]" === toS(obj);
                    }
                    function isRegExp(obj) {
                        return "[object RegExp]" === toS(obj);
                    }
                    function isError(obj) {
                        return "[object Error]" === toS(obj);
                    }
                    function isBoolean(obj) {
                        return "[object Boolean]" === toS(obj);
                    }
                    function isNumber(obj) {
                        return "[object Number]" === toS(obj);
                    }
                    function isString(obj) {
                        return "[object String]" === toS(obj);
                    }
                    var traverse = (module.exports = function(obj) {
                        return new Traverse(obj);
                    });
                    (Traverse.prototype.get = function(ps) {
                        for (var node = this.value, i = 0; i < ps.length; i++) {
                            var key = ps[i];
                            if (!node || !hasOwnProperty.call(node, key)) {
                                node = void 0;
                                break;
                            }
                            node = node[key];
                        }
                        return node;
                    }),
                        (Traverse.prototype.has = function(ps) {
                            for (
                                var node = this.value, i = 0;
                                i < ps.length;
                                i++
                            ) {
                                var key = ps[i];
                                if (!node || !hasOwnProperty.call(node, key))
                                    return !1;
                                node = node[key];
                            }
                            return !0;
                        }),
                        (Traverse.prototype.set = function(ps, value) {
                            for (
                                var node = this.value, i = 0;
                                i < ps.length - 1;
                                i++
                            ) {
                                var key = ps[i];
                                hasOwnProperty.call(node, key) ||
                                    (node[key] = {}),
                                    (node = node[key]);
                            }
                            return (node[ps[i]] = value), value;
                        }),
                        (Traverse.prototype.map = function(cb) {
                            return walk(this.value, cb, !0);
                        }),
                        (Traverse.prototype.forEach = function(cb) {
                            return (
                                (this.value = walk(this.value, cb, !1)),
                                this.value
                            );
                        }),
                        (Traverse.prototype.reduce = function(cb, init) {
                            var skip = 1 === arguments.length,
                                acc = skip ? this.value : init;
                            return (
                                this.forEach(function(x) {
                                    (this.isRoot && skip) ||
                                        (acc = cb.call(this, acc, x));
                                }),
                                acc
                            );
                        }),
                        (Traverse.prototype.paths = function() {
                            var acc = [];
                            return (
                                this.forEach(function() {
                                    acc.push(this.path);
                                }),
                                acc
                            );
                        }),
                        (Traverse.prototype.nodes = function() {
                            var acc = [];
                            return (
                                this.forEach(function() {
                                    acc.push(this.node);
                                }),
                                acc
                            );
                        }),
                        (Traverse.prototype.clone = function() {
                            var parents = [],
                                nodes = [];
                            return (function clone(src) {
                                for (var i = 0; i < parents.length; i++)
                                    if (parents[i] === src) return nodes[i];
                                if ("object" == typeof src && null !== src) {
                                    var dst = copy(src);
                                    return (
                                        parents.push(src),
                                        nodes.push(dst),
                                        forEach(objectKeys(src), function(key) {
                                            dst[key] = clone(src[key]);
                                        }),
                                        parents.pop(),
                                        nodes.pop(),
                                        dst
                                    );
                                }
                                return src;
                            })(this.value);
                        });
                    var objectKeys =
                            Object.keys ||
                            function(obj) {
                                var res = [];
                                for (var key in obj) res.push(key);
                                return res;
                            },
                        isArray =
                            Array.isArray ||
                            function(xs) {
                                return (
                                    "[object Array]" ===
                                    Object.prototype.toString.call(xs)
                                );
                            },
                        forEach = function(xs, fn) {
                            if (xs.forEach) return xs.forEach(fn);
                            for (var i = 0; i < xs.length; i++)
                                fn(xs[i], i, xs);
                        };
                    forEach(objectKeys(Traverse.prototype), function(key) {
                        traverse[key] = function(obj) {
                            var args = [].slice.call(arguments, 1),
                                t = new Traverse(obj);
                            return t[key].apply(t, args);
                        };
                    });
                    var hasOwnProperty =
                        Object.hasOwnProperty ||
                        function(obj, key) {
                            return key in obj;
                        };
                },
                {}
            ]
        },
        {},
        [1]
    )(1);
});
