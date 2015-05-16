/*!
 * 文件描述
 * @author ydr.me
 * @create 2015-02-05 10:51
 */


define(function (require, exports, module) {
    /**
     * @module parent/index
     */
    'use strict';

    var calendar = require('../../utils/calendar.js');
    var dato = require('../../utils/dato.js');
    var date = require('../../utils/date.js');
    var string = require('../../utils/string.js');
    var typeis = require('../../utils/typeis.js');
    var selector = require('../../core/dom/selector.js');
    var attribute = require('../../core/dom/attribute.js');
    var modification = require('../../core/dom/modification.js');
    var animation = require('../../core/dom/animation.js');
    var event = require('../../core/event/base.js');
    var Template = require('../../libs/Template.js');
    var ui = require('../');
    var templateWrap = require('./wrap.html', 'html');
    var templateList = require('./list.html', 'html');
    var templateToolbar = require('./toolbar.html', 'html');
    var style = require('./style.css', 'css');
    var Range = require('../../ui/Range/');
    var Popup = require('../../ui/Popup/');
    var tplWrap = new Template(templateWrap);
    var tplList = new Template(templateList);
    var tplToolbar = new Template(templateToolbar);
    var alienClass = 'alien-ui-datetimepicker';
    var alienIndex = 0;
    var REG_HOUR = /h/i;
    var REG_MINUTE = /m/;
    var REG_SECOND = /s/;
    var defaults = {
        format: 'YYYY-MM-DD',
        firstDayInWeek: 0,
        addClass: '',
        lang: {
            year: '年',
            month: '月',
            // 星期前缀，如：“星期”或“周”等
            weekPrefix: '',
            weeks: ['日', '一', '二', '三', '四', '五', '六']
        },
        range: [new Date(1970, 0, 1, 8, 0, 0, 0), new Date()],
        duration: 300,
        easing: 'in-out',
        disabledPrevMonth: true,
        disabledNextMonth: true
    };
    var DatetimePicker = ui.create({
        constructor: function ($input, options) {
            var the = this;

            the._$input = selector.query($input)[0];
            the._options = dato.extend(true, {}, defaults, options);
            the._init();
        },
        _init: function () {
            var the = this;
            var options = the._options;

            the._id = alienIndex++;
            // 选择的年、月
            the._current = {};
            // 选择的日期、时间
            the._choose = {};
            // 是否包含小时、分钟、秒
            the._hasHour = REG_HOUR.test(options.format);
            the._hasMinute = REG_MINUTE.test(options.format);
            the._hasSecond = REG_SECOND.test(options.format);
            the._initNode();
            the._initEvent();
        },


        /**
         * 渲染节点
         * @private
         */
        _initNode: function () {
            var the = this;

            the._date = date.parse(the._$input.value);
            the._popup = new Popup(the._$input, {
                addClass: alienClass + '-popup',
                priority: 'side'
            });
            the._popup.setContent(tplWrap.render({
                id: the._id,
                hasHour: the._hasHour,
                hasMinute: the._hasMinute,
                hasSecond: the._hasSecond
            }));
            var $wrap = selector.query('#' + alienClass + '-' + the._id)[0];
            var nodes = selector.query('.j-flag', $wrap);

            the._$toolbar = nodes[0];
            the._$list = nodes[1];
            the._$rangeText = nodes[2];
            the._$hour = nodes[3];
            the._$minute = nodes[4];
            the._$second = nodes[5];
            the._$wrap = $wrap;
            the._$now = selector.query('.j-now', $wrap)[0];
            the._$sure = selector.query('.j-sure', $wrap)[0];

            if (the._$hour) {
                the._rHour = new Range(the._$hour, {
                    min: 0,
                    max: 23,
                    step: 1,
                    value: the._choose.hours = the._date.getHours()
                }).on('change', function (val) {
                        the._choose.hours = val.max;
                        the._renderTime();
                        the._onchange();
                    });
            }

            if (the._$minute) {
                the._rHour = new Range(the._$minute, {
                    min: 0,
                    max: 59,
                    step: 1,
                    value: the._choose.minutes = the._date.getMinutes()
                }).on('change', function (val) {
                        the._choose.minutes = val.max;
                        the._renderTime();
                        the._onchange();
                    });
            }

            if (the._$second) {
                the._rHour = new Range(the._$second, {
                    min: 0,
                    max: 59,
                    step: 1,
                    value: the._choose.seconds = the._date.getSeconds()
                }).on('change', function (val) {
                        the._choose.seconds = val.max;
                        the._renderTime();
                        the._onchange();
                    });
            }

            the._renderToolbar();
            the._renderTime();
        },


        /**
         * 渲染 toolbar
         * @private
         */
        _renderToolbar: function () {
            var the = this;
            var options = the._options;
            var data = {
                years: [],
                months: []
            };
            var i;
            var j;

            for (i = options.range[0].getFullYear(), j = options.range[1].getFullYear(); i <= j; i++) {
                data.years.push({
                    value: i,
                    text: i + options.lang.year
                });
            }

            for (i = 1, j = 13; i < j; i++) {
                data.months.push({
                    value: i - 1,
                    text: i + options.lang.month
                });
            }

            the._$toolbar.innerHTML = tplToolbar.render(data);

            var nodes = selector.query('.j-flag', the._$toolbar);

            the._$year = nodes[0];
            the._$month = nodes[1];
        },


        /**
         * 渲染时间
         * @private
         */
        _renderTime: function () {
            var the = this;

            if (!the._$rangeText) {
                return;
            }

            var temp = '${hours}';

            if (the._$minute) {
                temp += ':${minutes}';
            }

            if (the._$second) {
                temp += ':${seconds}';
            }

            the._$rangeText.innerHTML = string.assign(temp, the._choose, function (val) {
                return string.padLeft(val, 2, 0);
            });
        },


        /**
         * 选择年份
         * @param fullyear
         * @returns {DatetimePicker}
         */
        selectYear: function (fullyear) {
            var the = this;

            the._$year.value = fullyear;

            return the;
        },


        /**
         * 选择年份
         * @param natureMonth
         * @returns {DatetimePicker}
         */
        selectMonth: function (natureMonth) {
            var the = this;

            the._$month.value = natureMonth - 1;

            return the;
        },


        /**
         * 初始化事件
         * @private
         */
        _initEvent: function () {
            var the = this;
            var options = the._options;

            event.on(the._$input, 'focusin', the.open.bind(the));
            event.on(the._$year, 'change', the._onchangeyear = function () {
                the._current.year = this.value;
                the._renderList();
            });
            event.on(the._$month, 'change', the._onchangemonth = function () {
                the._current.month = this.value;
                the._renderList();
            });
            event.on(the._$list, 'click', 'td', the._onchoose = function () {
                var y = attribute.data(this, 'year');
                var m = attribute.data(this, 'month');
                var d = attribute.data(this, 'date');

                if (y < options.range[0].getFullYear() || y > options.range[1].getFullYear()) {
                    return;
                }

                if (y === the._choose.year && m === the._choose.month && d === the._choose.date) {
                    return;
                }

                the._choose.year = y;
                the._choose.month = m;
                the._choose.date = d;
                attribute.removeClass(selector.query('td', the._$list), alienClass + '-active');
                attribute.addClass(this, alienClass + '-active');
                the._onchange();
            });
        },


        /**
         * 日期、时间变化
         * @private
         */
        _onchange: function () {
            var the = this;
            var options = the._options;

            the._date = new Date(the._choose.year, the._choose.month, the._choose.date,
                the._choose.hours, the._choose.minutes, the._choose.seconds, 0);

            the._$input.value = date.format(options.format, the._date);
            the.emit('change', the._date);
        },


        /**
         * 打开日历
         * @public
         */
        open: function () {
            var the = this;
            var value = the._$input.value;
            var d = date.parse(value);
            var year = d.getFullYear();
            var month = d.getMonth();

            if (value) {
                the._choose.year = year;
                the._choose.month = month;
                the._choose.date = d.getDate();
            }

            if (the._current.year !== year || the._current.month !== month) {
                the._current.year = year;
                the._current.month = month;
                the.selectYear(the._current.year);
                the.selectMonth(the._current.month + 1);
                the._renderList();
            }

            the._popup.open();

            return the;
        },


        /**
         * 关闭日历
         * @returns {DatetimePicker}
         */
        close: function () {
            var the = this;

            the._popup.close();

            return the;
        },


        /**
         * 渲染日历
         * @private
         */
        _renderList: function () {
            var the = this;
            var options = the._options;
            var list = calendar.month(the._current.year, the._current.month, dato.extend({}, options, {
                activeDate: the._choose.year ? new Date(the._choose.year, the._choose.month, the._choose.date) : null
            }));
            var data = {
                thead: [],
                tbody: list
            };
            var i = options.firstDayInWeek;
            var j = i + 7;
            var k;

            for (; i < j; i++) {
                k = i % 7;
                data.thead.push(options.lang.weekPrefix + options.lang.weeks[k]);
            }

            the._$list.innerHTML = tplList.render(data);
        },


        /**
         * 销毁实例
         */
        destroy: function () {


        }
    });

    DatetimePicker.defaults = defaults;
    module.exports = DatetimePicker;
    modification.importStyle(style);
});