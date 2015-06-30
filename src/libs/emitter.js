/*!
 * Emitter.js
 * @author ydr.me
 * 2014-09-19 11:20
 */


define(function (require, exports, module) {
    /**
     * @module libs/emitter
     * @requires utils/allocation
     * @requires utils/dato
     * @requires utils/typeis
     * @requires utils/class
     */
    'use strict';

    var allocation = require('../utils/allocation.js');
    var dato = require('../utils/dato.js');
    var typeis = require('../utils/typeis.js');
    var klass = require('../utils/class.js');
    var regSpace = /\s+/g;
    var alienId = 0;

    module.exports = klass.create({
        constructor: function () {
            var the = this;

            // 监听的事件 map
            the._emitterListener = {};
            // 监听的事件长度
            the._emitterLimit = 999;
            // 事件传输目标
            the._emitterTargetList = [];
        },
        /**
         * 添加事件回调
         * @method on
         * @param {String} eventType 事件类型，多个事件类型使用空格分开
         * @param {Function} listener 事件回调
         *
         * @example
         * var emitter = new Emitter();
         * emitter.on('hi', fn);
         */
        on: function (eventType, listener) {
            var the = this;

            _middleware(eventType, function (et) {
                if (!the._emitterListener[et]) {
                    the._emitterListener[et] = [];
                }

                if (the._emitterListener[et].length === the._emitterLimit) {
                    throw new Error('instance event `' + et + '` pool is full as ' + this._emitterLimit);
                }

                if (typeis.function(listener)) {
                    the._emitterListener[et].push(listener);
                }
            });

            return the;
        },


        before: function () {

        },


        /**
         * 移除事件回调
         * @method un
         * @param {String} eventType 事件类型，多个事件类型使用空格分开
         * @param {Function} [listener] 事件回调，缺省时将移除该事件类型上的所有事件回调
         *
         * @example
         * var emitter = new Emitter();
         * emitter.un('hi', fn);
         * emitter.un('hi');
         */
        un: function (eventType, listener) {
            var the = this;

            _middleware(eventType, function (et) {
                if (the._emitterListener[et] && listener) {
                    dato.each(the._emitterListener, function (index, _listener) {
                        if (listener === _listener) {
                            the._emitterListener.splice(index, 1);
                            return false;
                        }
                    });
                } else {
                    the._emitterListener = [];
                }
            });

            return the;
        },


        /**
         * 事件触发，只要有一个事件返回false，那么就返回false，非链式调用
         * @method emit
         * @param {String} [eventType] 事件类型，多个事件类型使用空格分开
         * @returns {*} 函数执行结果
         *
         * @example
         * var emitter = new Emitter();
         * emitter.emit('hi', 1, 2, 3);
         * emitter.emit('hi', 1, 2);
         * emitter.emit('hi', 1);
         * emitter.emit('hi');
         *
         * // 为 before* 的事件可以被派发到 before 回调
         * // 为 after* 的开头的事件可以被派发到 after 回调
         */
        emit: function (eventType/*arguments*/) {
            var the = this;
            var emitArgs = dato.toArray(arguments).slice(1);
            var ret = true;

            if (!the._emitterListener) {
                throw 'can not found emitterListener property';
            }

            _middleware(eventType, function (et) {
                if (the._pipe(et, emitArgs) === false) {
                    ret = false;
                }

                if (the._emitterListener[et]) {
                    var time = Date.now();

                    dato.each(the._emitterListener[et], function (index, listener) {
                        the.alienEmitter = {
                            type: et,
                            timestamp: time,
                            id: alienId++
                        };

                        if (listener.apply(the, emitArgs) === false) {
                            ret = false;
                        }
                    });
                }
            });

            return ret;
        },


        /**
         * 将所有的事件派发到目标
         * @param target {Object} 目标
         * @param [emitters] {Array} 传递的事件数组，默认为全部
         */
        pipe: function (target, emitters) {
            var the = this;

            the._emitterTargetList.push({
                source: target,
                emitters: typeis.array(emitters) ? emitters : []
            });

            return the;
        },


        /**
         * 派发事件
         * @param eventType
         * @param args
         * @private
         */
        _pipe: function (eventType, args) {
            var ret = true;

            dato.each(this._emitterTargetList, function (index, target) {
                if (_matches(eventType, target.emitters)) {
                    target.source.alienEmitter = {
                        type: eventType,
                        timestamp: Date.now(),
                        id: alienId++
                    };
                    args.unshift(eventType);
                    ret = target.source.emit.apply(target.source, args);
                }
            });

            return ret;
        }
    });


    /**
     * 中间件，处理事件分发
     * @param {String} eventTypes 事件类型
     * @param {Function} callback 回调处理
     * @private
     */
    function _middleware(eventTypes, callback) {
        dato.each(eventTypes.trim().split(regSpace), function (index, eventType) {
            callback(eventType);
        });
    }


    /**
     * 判断是否匹配
     * @param name {String} 待匹配字符串
     * @param names {Array} 被匹配字符串数组
     * @returns {boolean}
     * @private
     */
    function _matches(name, names) {
        if (!names.length) {
            return true;
        }

        var matched = true;

        dato.each(names, function (index, _name) {
            var flag = _name[0];

            // !name
            if (flag === '!') {
                matched = true;

                if (name === _name.slice(1)) {
                    matched = false;
                    return false;
                }
            }
            // name
            else {
                matched = false;

                if (name === _name) {
                    matched = true;
                    return false;
                }
            }
        });

        return matched;
    }
});