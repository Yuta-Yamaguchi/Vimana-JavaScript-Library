/**
 *
 * @author Fumiya FURUYA
 * @author Yuta YAMAGUCHI
 */

var vimana = vimana || {};

(function() {
  var A_DAY_MILLI_SEC = 86400000;
  var A_WEEK_MILLI_SEC = 604800000;
  var schedule = [];

  // Util Scheduler
  (function() {
    var nextCallMilliSec = 3000;
    var timer = function() {
      var thisTime = new Date().getTime();
      for (var i = 0; i < schedule.length; i++) { //schedule data is sorted!
        var diff = parseInt(schedule[i].callUnixTime, 10) - thisTime;
        if (diff <= 0) {
          schedule[i].callFunction(schedule[i].argument);
          schedule.splice(i, 1);
          i--;
        } else {
          nextCallMilliSec = Math.min(diff, nextCallMilliSec);
          break;
        }
      }
      setTimeout(timer, nextCallMilliSec);
    };
    timer();
  })();

  vimana.util = {
    setCache: function(options) {
      var defaults = {
        key: '',
        value: '',
        term: ''
      };
      var settings = $.extend(defaults, options);

      if (!settings.key) {
        return false;
      } else if (typeof settings.value != 'string') {
        return false;
      }

      //デフォのキャッシュ期限はnew Date()+1日
      if (!settings.term || isNaN(new Date(settings.term).getTime())) {
        //新しい期限が設定されていない場合，古い設定を引き継ぐ
        if (localStorage.getItem(settings.key) !== null) {
          settings.term = JSON.parse(localStorage.getItem(settings.key)).term;
        //新規案件はデフォ値
        } else {
          settings.term = (new Date().getTime() + A_DAY_MILLI_SEC);
        }
      }

      //最大のキャッシュ期限はnew Date()+1週間
      if ((new Date().getTime() + A_WEEK_MILLI_SEC) <
          parseInt(settings.term, 10)) {
        settings.term = (new Date().getTime() + A_WEEK_MILLI_SEC);
      }

      var strageData;
      try {
        strageData = JSON.stringify({
          term: settings.term,
          data: settings.value
        });
      } catch (e) {
        return false;
      }

      localStorage.setItem(settings.key, strageData);
      return true;
    },
    getCache: function(key) {
      var strageData;
      try {
        strageData = JSON.parse(localStorage.getItem(key));
      } catch (e) {
        return null;
      }

      if (!strageData || !vimana.util.arrayKeyExists('term', strageData)) {
        return null;
      }

      if (new Date().getTime() > parseInt(strageData.term, 10)) {
        localStorage.removeItem(key);
        return null;
      }

      if (typeof strageData.data == 'object') {
        return JSON.stringify(strageData.data);
      }

      return strageData.data;
    },
    clearCache: function(key) {
      var strageData = JSON.stringify({
        term: 0,
        data: ''
      });

      localStorage.setItem(key, strageData);
    },
    setSchedule: function(callUnixTime, callFunction, argument) {
      if (!callUnixTime || isNaN(new Date(callUnixTime).getTime())) {
        return;
      }
      if (!callFunction || typeof callback == 'function') {
        return;
      }
      var data = {
        'callUnixTime': callUnixTime,
        'callFunction': callFunction,
        'argument': argument
      };
      schedule.push(data);
      schedule.sort(function(x, y) {
        return x.callUnixTime - y.callUnixTime;
      });
    },
    arrayKeyExists: function(key, search) {
      if (!search ||
          (search.constructor !== Array &&
           search.constructor !== Object)) {
        return false;
      }

      return key in search;
    }
  };

  // IE対策
  Number.isFinite = Number.isFinite || function(any) {
    return typeof any === 'number' && isFinite(any);
  };

  Number.isNaN = Number.isNaN || function(any) {
    return typeof any === 'number' && isNaN(any);
  };
})();
