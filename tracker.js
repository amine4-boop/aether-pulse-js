/**
 * Aether Pulse Smart Tracker v1.0
 * Lightweight, zero-cookie, edge-optimized analytics collector
 */
(function (window) {
  'use strict';

  var document = window.document;
  var navigator = window.navigator;
  var location = window.location;

  var script = document.currentScript || document.querySelector('script[data-site-id]');
  if (!script) return;

  var siteId = script.getAttribute('data-site-id');
  var endpoint = script.getAttribute('data-endpoint');

  if (!siteId || !endpoint) return;

  var startTime = Date.now();
  var clicks = 0;
  var maxScroll = 0;

  // رصد النقرات بدون إرسال شبكة فوري (حفظ محلي فقط)
  document.addEventListener('click', function () {
    clicks++;
  }, { passive: true });

  // رصد أقصى عمق تمرير في الصفحة
  window.addEventListener('scroll', function () {
    var totalHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (totalHeight > 0) {
      var currentScroll = Math.round((window.scrollY / totalHeight) * 100);
      if (currentScroll > maxScroll) maxScroll = Math.min(100, currentScroll);
    }
  }, { passive: true });

  // تجهيز حزمة البيانات المجمعة
  function buildPayload(isExit) {
    var dwellTime = Math.round((Date.now() - startTime) / 1000);
    return JSON.stringify({
      site_id: siteId,
      path: location.pathname + location.search,
      referrer: document.referrer || '',
      screen: window.innerWidth + 'x' + window.innerHeight,
      language: navigator.language || 'en',
      dwell_time: dwellTime,
      clicks: clicks,
      scroll_depth: maxScroll,
      is_exit: !!isExit
    });
  }

  // إرسال البيانات بطريقة آمنة لا تغلق الاتصال حتى لو انطفأ المتصفح
  function sendData(isExit) {
    var data = buildPayload(isExit);
    if (navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, data);
    } else {
      var xhr = new XMLHttpRequest();
      xhr.open('POST', endpoint, true);
      xhr.setRequestHeader('Content-Type', 'text/plain');
      xhr.send(data);
    }
  }

  // 1. تسجيل الزيارة فور التحميل
  if (document.readyState === 'complete') {
    sendData(false);
  } else {
    window.addEventListener('load', function () {
      sendData(false);
    });
  }

  // 2. تسجيل مدة البقاء والنقرات وعمق التصفح عند خروج المستخدم أو إغلاق التبويب
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') {
      sendData(true);
    }
  });

})(window);
