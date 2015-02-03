/**
 * jQuery PSAJAX Library v0.2
 * @author Fumiya FURUYA
 * @author Yuta YAMAGUCHI
 * @author Shun SAKAI
 */

(function($) {
  cacheMapping = {};
  var $appendTarget;
  var timeoutTimer;
  var defaults = {
    timeout: 850,
    type: 'GET',
    dataType: 'html'
  };

  $.hpjax = function(absolutePath) {
    var urlObject = urlParser(absolutePath);
    contentsView(urlObject);
  };

  $.fn.hpjax = function(selector, container) {
    $appendTarget = $(container);
    $appendTarget.find('.content-panel').addClass('content-active');
    cacheMapping[location.pathname] = $appendTarget.find('.content-active');

    var $docObject = $(this);// #document
    $docObject.on('click', selector, function(event) {
      event.preventDefault();
      var absolutePath = $(this).attr('href');
      var urlObject = urlParser(absolutePath);
      contentsView(urlObject);
    });

    $(window).on('popstate', function(event) {
      var $cachedObject, urlObject;
      var state = event.originalEvent.state;

      if (state) {
        $cachedObject = cacheMapping[state];
        urlObject = urlParser(state);
        if ($cachedObject) {
          $cachedObject.trigger('hpjax:cached', state);
          contentsShowHide($cachedObject, urlObject);
        } else {
          pushStateAjax(urlObject, false);
        }
      } else {
        $cachedObject = cacheMapping[location.pathname];
        urlObject = urlParser(location.pathname);
        if ($cachedObject) {
          $cachedObject.trigger('hpjax:cached', location.pathname);
          contentsShowHide($cachedObject, urlObject);
        } else {
          pushStateAjax(urlObject, false);
        }
      }
    });
  };

  var contentsView = function(urlObject) {
    var absolutePath = urlObject.url;
    var query = '';
    if (absolutePath.indexOf('?') >= 0) {
      query = absolutePath.substring(absolutePath.indexOf('?'));
    }
    var $cachedObject = cacheMapping[absolutePath.replace(query, '')];
    if ($cachedObject) {
      history.pushState(absolutePath, '', absolutePath);
      $cachedObject.trigger('hpjax:cached', urlObject);
      contentsShowHide($cachedObject, urlObject);
    } else {
      pushStateAjax(urlObject, true);
    }
  };

  var pushStateAjax = function(urlObject, doPushState) {
    var absolutePath = urlObject.url;
    var query = '';
    var urlParam = '?hpjax=1';
    if (absolutePath.indexOf('?') >= 0) {
      query = absolutePath.substring(absolutePath.indexOf('?'));
      urlParam = '&hpjax=1';
    }

    var options = $.extend(true, {}, $.ajaxSettings, defaults);

    options.url = options.history_url = absolutePath;
    options.url += urlParam;

    options.beforeSend = function(xhr, settings) {
      if (settings.type !== 'GET') {
        settings.timeout = 0;
      }
      xhr.setRequestHeader('X-HPJAX', 'true');
      if (settings.timeout > 0) {
        timeoutTimer = setTimeout(function() {
          location.href = settings.history_url;
        }, settings.timeout);
        settings.timeout = 0;
      }
    };
    options.complete = function() {
      if (timeoutTimer) {
        clearTimeout(timeoutTimer);
      }
    };
    options.success = function(data, status, xhr) {
      var cacheObject = $(data);
      var state = urlObject.url;
      $appendTarget.append(cacheObject);

      cacheMapping[state.replace(query, '')] = cacheObject;
      if (doPushState) {
        history.pushState(state, '', state);
      }

      contentsShowHide(cacheObject.trigger('hpjax:loaded', state), urlObject);
    };

    $.ajax(options);
  };

  var contentsShowHide = function(showElem, urlObject) {
    $appendTarget.find('.content-active').removeClass('content-active');
    $appendTarget.trigger('hpjax:hide');
    showElem.addClass('content-active').trigger('hpjax:show', urlObject.url);
    if (urlObject.anchor) {
      scroll(urlObject.anchor);
    }
  };

  var urlParser = function(url) {
    var index;
    var anchor = '';
    if ((index = url.indexOf('#')) > -1) {
      anchor = url.substring(index);
      url = url.substring(0, index);
      if ((index = anchor.indexOf('?')) > -1) {
        url += anchor.substring(index);
        anchor = anchor.substring(0, index);
      }
    }

    return {url: url, anchor: anchor};
  };

  var scroll = function(target) {
    var p = ($(target).offset().top - $('#global-header').height());
    $('body').animate({scrollTop: p});
  };
})(jQuery);
