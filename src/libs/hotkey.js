/**
 * 热键
 * @author ydr.me
 * @create 2016-01-05 21:31
 */


define(function (require, exports, module) {
    /**
     * @module libs/hotkey
     * @reuqires libs/emitter
     * @reuqires utils/class
     * @reuqires utils/dato
     * @reuqires utils/typeis
     * @reuqires core/event/base
     */

    'use strict';

    var Emitter = require('./emitter.js');
    var klass = require('../utils/class.js');
    var dato = require('../utils/dato.js');
    var typeis = require('../utils/typeis.js');
    var event = require('../core/event/base.js');

    var specialKeys = {
        8: 'backspace',
        9: 'tab',
        10: ['return', 'enter'],
        13: ['return', 'enter'],
        16: 'shift',
        17: 'ctrl',
        18: ['alt', 'option'],
        19: 'pause',
        20: 'capslock',
        27: 'esc',
        32: 'space',
        33: 'pageup',
        34: 'pagedown',
        35: 'end',
        36: 'home',
        37: 'left',
        38: 'up',
        39: 'right',
        40: 'down',
        45: 'insert',
        46: 'del',
        59: ';',
        61: '=',
        91: 'cmd',
        96: '0',
        97: ['1', '!'],
        98: ['2', '@'],
        99: ['3', '#'],
        100: ['4', '$'],
        101: ['5', '%'],
        102: ['6', '^'],
        103: ['7', '&'],
        104: ['8', '*'],
        105: ['9', '('],
        106: '*',
        107: ['+', '='],
        109: ['-', '_'],
        110: ['.', '>'],
        111: ['/', '?'],
        112: 'f1',
        113: 'f2',
        114: 'f3',
        115: 'f4',
        116: 'f5',
        117: 'f6',
        118: 'f7',
        119: 'f8',
        120: 'f9',
        121: 'f10',
        122: 'f11',
        123: 'f12',
        144: 'numlock',
        145: 'scroll',
        173: '-',
        186: [';', ':'],
        187: '=',
        188: [',', '<'],
        189: '-',
        190: '.',
        191: '/',
        192: ['`', '~'],
        219: ['[', '{'],
        220: ['\\', '|'],
        221: [']', '}'],
        222: ['\'', '"']
    };
    var secondaryKeys = ['ctrl', 'alt', 'meta', 'shift'];
    var secondaryAlias = ['ctrl', 'alt', 'cmd', 'shift'];
    var defaults = {};
    var Hotkey = klass.extend(Emitter).create(function (ele, options) {
        var the = this;

        the._options = dato.extend({}, defaults, options);
        event.on(ele, 'keydown', function (eve) {
            var which = eve.which;
            var specialKey = specialKeys[which];
            var character = specialKey ? specialKey : String.fromCharCode(which).toLowerCase();
            var eventType = '';
            var characters = typeis.Array(character) ? character : [character];

            dato.each(characters, function (index, character) {
                if (secondaryAlias.indexOf(character) > -1) {
                    return;
                }

                dato.each(secondaryKeys, function (index, secondaryKey) {
                    if (eve[secondaryKey + 'Key'] && specialKey !== secondaryKey) {
                        eventType += secondaryAlias[index] + '+';
                    }
                });

                var ret = the.emit(eventType + character, eve);

                console.log(ret);
                if (ret === false) {
                    try {
                        eve.preventDefault();
                        eve.stopPropagation();
                        eve.stopImmediatePropagation();
                    } catch (err) {
                        // ignore
                    }
                }
            });
        });
    });

    Hotkey.defaults = defaults;
    module.exports = Hotkey;
});