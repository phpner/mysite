/*
  Masked Input plugin for jQuery
  Copyright (c) 2007-2013 Josh Bush (digitalbush.com)
  Licensed under the MIT license (http://digitalbush.com/projects/masked-input-plugin/#license)
  Version: 1.3.1
*/
(function($) {

  /* 
   * Lazy Line Painter - Path Object 
   * Generated using 'SVG to Lazy Line Converter'
   * 
   * http://lazylinepainter.info 
   * Copyright 2013, Cam O'Connell  
   *  
   */ 
   
   
  /* 
   Setup and Paint your lazyline! 
   */ 

  function getPasteEvent() {
    var el = document.createElement('input'),
        name = 'onpaste';
    el.setAttribute(name, '');
    return (typeof el[name] === 'function')?'paste':'input';             
}

var pasteEventName = getPasteEvent() + ".mask",
  ua = navigator.userAgent,
  iPhone = /iphone/i.test(ua),
  android=/android/i.test(ua),
  caretTimeoutId;

$.mask = {
  //Predefined character definitions
  definitions: {
    '9': "[0-9]",
    'a': "[A-Za-z]",
    '*': "[A-Za-z0-9]"
  },
  dataName: "rawMaskFn",
  placeholder: '_',
};

$.fn.extend({
  //Helper Function for Caret positioning
  caret: function(begin, end) {
    var range;

    if (this.length === 0 || this.is(":hidden")) {
      return;
    }

    if (typeof begin == 'number') {
      end = (typeof end === 'number') ? end : begin;
      return this.each(function() {
        if (this.setSelectionRange) {
          this.setSelectionRange(begin, end);
        } else if (this.createTextRange) {
          range = this.createTextRange();
          range.collapse(true);
          range.moveEnd('character', end);
          range.moveStart('character', begin);
          range.select();
        }
      });
    } else {
      if (this[0].setSelectionRange) {
        begin = this[0].selectionStart;
        end = this[0].selectionEnd;
      } else if (document.selection && document.selection.createRange) {
        range = document.selection.createRange();
        begin = 0 - range.duplicate().moveStart('character', -100000);
        end = begin + range.text.length;
      }
      return { begin: begin, end: end };
    }
  },
  unmask: function() {
    return this.trigger("unmask");
  },
  mask: function(mask, settings) {
    var input,
      defs,
      tests,
      partialPosition,
      firstNonMaskPos,
      len;

    if (!mask && this.length > 0) {
      input = $(this[0]);
      return input.data($.mask.dataName)();
    }
    settings = $.extend({
      placeholder: $.mask.placeholder, // Load default placeholder
      completed: null
    }, settings);


    defs = $.mask.definitions;
    tests = [];
    partialPosition = len = mask.length;
    firstNonMaskPos = null;

    $.each(mask.split(""), function(i, c) {
      if (c == '?') {
        len--;
        partialPosition = i;
      } else if (defs[c]) {
        tests.push(new RegExp(defs[c]));
        if (firstNonMaskPos === null) {
          firstNonMaskPos = tests.length - 1;
        }
      } else {
        tests.push(null);
      }
    });

    return this.trigger("unmask").each(function() {
      var input = $(this),
        buffer = $.map(
        mask.split(""),
        function(c, i) {
          if (c != '?') {
            return defs[c] ? settings.placeholder : c;
          }
        }),
        focusText = input.val();

      function seekNext(pos) {
        while (++pos < len && !tests[pos]);
        return pos;
      }

      function seekPrev(pos) {
        while (--pos >= 0 && !tests[pos]);
        return pos;
      }

      function shiftL(begin,end) {
        var i,
          j;

        if (begin<0) {
          return;
        }

        for (i = begin, j = seekNext(end); i < len; i++) {
          if (tests[i]) {
            if (j < len && tests[i].test(buffer[j])) {
              buffer[i] = buffer[j];
              buffer[j] = settings.placeholder;
            } else {
              break;
            }

            j = seekNext(j);
          }
        }
        writeBuffer();
        input.caret(Math.max(firstNonMaskPos, begin));
      }

      function shiftR(pos) {
        var i,
          c,
          j,
          t;

        for (i = pos, c = settings.placeholder; i < len; i++) {
          if (tests[i]) {
            j = seekNext(i);
            t = buffer[i];
            buffer[i] = c;
            if (j < len && tests[j].test(t)) {
              c = t;
            } else {
              break;
            }
          }
        }
      }

      function keydownEvent(e) {
        var k = e.which,
          pos,
          begin,
          end;

        //backspace, delete, and escape get special treatment
        if (k === 8 || k === 46 || (iPhone && k === 127)) {
          pos = input.caret();
          begin = pos.begin;
          end = pos.end;

          if (end - begin === 0) {
            begin=k!==46?seekPrev(begin):(end=seekNext(begin-1));
            end=k===46?seekNext(end):end;
          }
          clearBuffer(begin, end);
          shiftL(begin, end - 1);

          e.preventDefault();
        } else if (k == 27) {//escape
          input.val(focusText);
          input.caret(0, checkVal());
          e.preventDefault();
        }
      }

      function keypressEvent(e) {
        var k = e.which,
          pos = input.caret(),
          p,
          c,
          next;

        if (e.ctrlKey || e.altKey || e.metaKey || k < 32) {//Ignore
          return;
        } else if (k) {
          if (pos.end - pos.begin !== 0){
            clearBuffer(pos.begin, pos.end);
            shiftL(pos.begin, pos.end-1);
          }

          p = seekNext(pos.begin - 1);
          if (p < len) {
            c = String.fromCharCode(k);
            if (tests[p].test(c)) {
              shiftR(p);

              buffer[p] = c;
              writeBuffer();
              next = seekNext(p);

              if(android){
                setTimeout($.proxy($.fn.caret,input,next),0);
              }else{
                input.caret(next);
              }

              if (settings.completed && next >= len) {
                settings.completed.call(input);
              }
            }
          }
          e.preventDefault();
        }
      }

      function clearBuffer(start, end) {
        var i;
        for (i = start; i < end && i < len; i++) {
          if (tests[i]) {
            buffer[i] = settings.placeholder;
          }
        }
      }

      function writeBuffer() { input.val(buffer.join('')); }

      function checkVal(allow) {
        //try to place characters where they belong
        var test = input.val(),
          lastMatch = -1,
          i,
          c;

        for (i = 0, pos = 0; i < len; i++) {
          if (tests[i]) {
            buffer[i] = settings.placeholder;
            while (pos++ < test.length) {
              c = test.charAt(pos - 1);
              if (tests[i].test(c)) {
                buffer[i] = c;
                lastMatch = i;
                break;
              }
            }
            if (pos > test.length) {
              break;
            }
          } else if (buffer[i] === test.charAt(pos) && i !== partialPosition) {
            pos++;
            lastMatch = i;
          }
        }
        if (allow) {
          writeBuffer();
        } else if (lastMatch + 1 < partialPosition) {
          input.val("");
          clearBuffer(0, len);
        } else {
          writeBuffer();
          input.val(input.val().substring(0, lastMatch + 1));
        }
        return (partialPosition ? i : firstNonMaskPos);
      }

      input.data($.mask.dataName,function(){
        return $.map(buffer, function(c, i) {
          return tests[i]&&c!=settings.placeholder ? c : null;
        }).join('');
      });

      if (!input.attr("readonly"))
        input
        .one("unmask", function() {
          input
            .unbind(".mask")
            .removeData($.mask.dataName);
        })
        .bind("focus.mask", function() {
          clearTimeout(caretTimeoutId);
          var pos,
            moveCaret;

          focusText = input.val();
          pos = checkVal();
          
          caretTimeoutId = setTimeout(function(){
            writeBuffer();
            if (pos == mask.length) {
              input.caret(0, pos);
            } else {
              input.caret(pos);
            }
          }, 10);
        })
        .bind("blur.mask", function() {
          checkVal();
          if (input.val() != focusText)
            input.change();
        })
        .bind("keydown.mask", keydownEvent)
        .bind("keypress.mask", keypressEvent)
        .bind(pasteEventName, function() {
          setTimeout(function() { 
            var pos=checkVal(true);
            input.caret(pos); 
            if (settings.completed && pos == input.val().length)
              settings.completed.call(input);
          }, 0);
        });
      checkVal(); //Perform initial check for existing values
    });
  }
});


})(jQuery);


var hash = null;
var num = null;
var wrap = null;
var section = null;
var sectionItem = null;
var sectionLeng = null;
var timeout = null;
var y = 0;
var macTime = navigator.userAgent.indexOf('Macintosh') != -1 ? 500 : 0;
var menuBtn = null;
var stopClick = null;
var menuLink = null;
var quarterItem = null;
var w = null;
var h = null;
var quarterItemDrop = false;

function mouseWheel(e){
  var delta = e.deltaY > 0 ? 1 : -1;
  if(quarterItemDrop || $('body').hasClass('main_menu_active') || $('body').hasClass('main_form_active') || new Date() - timeout < 500 + macTime) return false;
  timeout = new Date();
  goSlide($('.section.active'), delta)
};

function cssTransform(elem, z){
  elem.css({
    'transform': 'translateX(' + z + ')',
    '-webkit-transform': 'translateX(' + z + ')',
    '-moz-transform': 'translateX(' + z + ')',
    '-ms-transform': 'translateX(' + z + ')',
    '-o-transform': 'translateX(' + z + ')'
  });
};

function goSlide(active, state){
  var chL = active.children('.section__left');
  var chR = active.children('.section__right');
  var chAll = section.children('.section__item');

  if(state > 0){
    if(active.index() == sectionLeng) return false;
    chAll.addClass('transition_600ms');
    section.addClass('transition_600ms');
    cssTransform(chL, '-100%');
    cssTransform(chR, '100%');
    active
      .addClass('vis_hidden')
      .removeClass('active')
      .next()
      .addClass('active');
    moveSlide($('.section.active'), true);
    y += state;
  }else{
    if(active.index() == 0) return false;
    chAll.addClass('transition_600ms');
    section.addClass('transition_600ms');
    active.removeClass('active').prev().removeClass('vis_hidden').addClass('active');
    
    cssTransform(active.prev().find('.section__left'), '0px');
    cssTransform(active.prev().find('.section__right'), '0px');

    moveSlide(active, false);
    y += state;
  }
  setHash(y);
};

function onLinkClick(){
  var url = $(this).attr('href');
  $('.section__quarter_item_active .section__quarter_item__close').trigger('click');
  setHash(url);
  init(true);
  closeMenu();
  return false;
};

function moveSlide(t, state){
  var scale = state ? 1 : 0.5;
  var opacity = state ? 1 : 0;
  t.css({
    'transform': 'scale(' + scale + ')',
    '-webkit-transform': 'scale(' + scale + ')',
    '-moz-transform': 'scale(' + scale + ')',
    '-ms-transform': 'scale(' + scale + ')',
    '-o-transform': 'scale(' + scale + ')',
    'opacity': opacity
  });
};

function setHash(key){
  var lang = $('body').data('lang') == 'ru' ? '/en/' : '/ru/';
  window.location.hash = key;
  $('.lang_toggle__toggle').attr('href', lang + '#' + key);
};

function getMenuClassNameByNumber(number) {

  var class_name = false;

  if (number == 0)
  {
    class_name = 'main_menu_index';
  }
  if (number == 1)
  {
    class_name = 'main_menu_about';
  }
  if (number == 2)
  {
    class_name = 'main_menu_asort';
  }
  if (number == 3) 
  {
    class_name = 'main_menu_work';
  }
  if (number == 4)
  {
    class_name = 'main_menu_price';
  }
  if (number == 5)
  {
    class_name = 'main_menu_map';
  }

  return class_name;

}

function openMenu(){
  $('body').addClass('main_menu_active');
  $('.main_menu__b__link').removeClass('main_menu__b__link_active');
  $('.' + getMenuClassNameByNumber(y)).addClass('main_menu__b__link_active');
};

function closeMenu(){
  $('body')
    .removeClass('main_menu_active')
    .removeClass('main_form_active');
};

function onStopClick(e){
  e.stopPropagation();
};

function menuLinkActive(key){
  $('.main_menu__b__link').removeClass('main_menu__b__link_active');

  $('.' + getMenuClassNameByNumber(key)).addClass('main_menu__b__link_active');
};

function onQuarterItemClick(){
  var _this = $(this);
  var parent = _this.closest('.section__item');
  var _section = _this.closest('.section');
  
  if($('body').hasClass('main_menu_active') || _this.hasClass('section__quarter_item_active')){
    closeMenu();
    return false;
  }
  quarterItemDrop = true;
  _this
    .addClass('section__quarter_item_active')
    .addClass('section__quarter_item_animate');
  parent.addClass('section__item_active');
  _section.addClass('section_drop');
  $(this).css({
    'width': w,
    'height': h
  });
  setTimeout(function(){
    _this.removeClass('section__quarter_item_animate');
  }, 400)
};

function init(clear){
  w = $(window).outerWidth();
  h = $(window).outerHeight();
  wrap = document.getElementById('body_wrap');
  section = $('.section');
  sectionItem = $('.section__item');
  sectionLeng = section.length - 1;
  menuBtn = $('.menu_btn');
  stopClick = $('.stop_click');
  menuLink = $('.main_menu__b__link, .links');
  quarterItem = $('.section__quarter_item');
  hash = parseInt(window.location.hash.replace(/\#/g, '') == '' ? 0 : window.location.hash.replace(/\#/g, ''));

  y = num = hash > sectionLeng || hash < 0 ? 0 : hash;

  setHash(num);
  menuLinkActive(num);


  if(clear){
    section
      .removeClass('vis_hidden')
      .removeClass('transition_600ms')
      .removeClass( 'active');
    $('.section__item').removeClass('transition_600ms')
    moveSlide(section.eq(num), true);
  }

  section.each(function(i, item){
    var _item = $(item);
    var sL = _item.find('.section__left');
    var sR = _item.find('.section__right');

    _item.css('z-index', sectionLeng - i);


    if(i > num){
      moveSlide(_item, false);
      cssTransform(sL, '0px');
      cssTransform(sR, '0px');
    }else if(i == num){
      _item.addClass('active');
      cssTransform(sL, '0px');
      cssTransform(sR, '0px');
    }else{
      moveSlide(_item, true);
      _item.addClass('vis_hidden');
      cssTransform(sL, '-100%');
      cssTransform(sR, '100%');

    }

  });
  $('body').removeClass('not_transition');
};

$(document).ready(function(e) {

  init();

  document.addEventListener("wheel", mouseWheel, false);
  menuBtn.click("click", openMenu);
  stopClick.click("click", onStopClick);
  menuLink.click("click", onLinkClick);
  quarterItem.click("click", onQuarterItemClick);

  var lang = $('body').data('lang');

  $('.lang_toggle__toggle').addClass('lang_toggle__toggle_' + lang);
  
  $('.section__quarter_item__close').click("click", function(e){
    var _this = $(this).closest('.section__quarter_item');
    var sectionItemActive = $('.section__item_active');
    
    if($('body').hasClass('main_menu_active') && !quarterItemDrop){
      closeMenu();
      return false;
    }
    _this.css({
      'width': '100%',
      'height': '50%'
    });
    _this.addClass('section__quarter_item_animate');
    $('.section_drop').removeClass('section_drop');
    setTimeout(function(){
      sectionItemActive.removeClass('section__item_active');
      _this
        .removeClass('section__quarter_item_active')
        .removeClass('section__quarter_item_animate');
    }, 300);
    quarterItemDrop = false;
    e.stopPropagation();
  });
  
  $(window).resize(function(){
    w = $(this).outerWidth();
    h = $(this).outerHeight();
    $('.section__quarter_item.section__quarter_item_active').css({
      'width': w,
      'height': h
    });
    $('.section').outerHeight(h);
  }).resize();


});

function map_box_set_active(_this) {
  var this_box = $(_this).parent();
  var this_data = $(this_box).find('.section__item_map__inf_box__data');

  var active_elem = $('.section__item_map__inf_box__active');

  $(active_elem).find('.section__item_map__inf_box__data').css('display', 'none');
  $(active_elem).find('.section__item_map__inf_box__preview').css('display', 'block');
  $(active_elem).removeClass('section__item_map__inf_box__active');

  $(_this).css('display', 'none');
  $(this_data).css('display', 'block');
  $(this_box).addClass('section__item_map__inf_box__active');


}