(function ($) {
  $.fn.pk_form = function (options) {
    
    if (!this.length ) {
      return this;
    }


    
    function validInn(c){
      var cs = null;
      c = c + '';
      if(c.length == 10){
        cs = (2 * c[0] + 4 * c[1] + 10 * c[2] + 3 * c[3] + 5 * c[4] + 9 * c[5] + 4 * c[6] + 6 * c[7] + 8 * c[8]);
        cs = cs % 11;
        cs = cs % 10;
        if(cs == c[9]){
          return true;
        }
      }
      else if(c.length == 12){
        cs = (7 * c[0] + 2 * c[1] + 4 * c[2] + 10 * c[3] + 3 * c[4] + 5 * c[5] + 9 * c[6] + 4 * c[7] + 6 * c[8] + 8 * c[9]);
        cs = cs % 11;
        cs = cs % 10;
        if(cs == c[10]){
          cs = (3 * c[0] + 7 * c[1] + 2 * c[2] + 4 * c[3] + 10 * c[4] + 3 * c[5] + 5 * c[6] + 9 * c[7] + 4 * c[8] + 6 * c[9] + 8 * c[10]);
          cs = cs % 11;
          cs = cs % 10;
          if(cs == c[11]){
            return true;
          }
        }
      }else{
        return false;
      }
    };
    
    $(this).each(function(i, elem){
      var $form = $(elem);
      var fields = [];
      var valArr = [];
      var err = '<div class="error_message fs_13" style="color: red;text-align:left;display:none;">Заполните это поле.</div>';
      var state = [];
      var regEmail = /^([^@\s]+)@((?:[-a-z0-9]+\.)+[a-z]{2,})$/i;
      options = $.extend(true, {
        callback: 'void(0);',
      }, options);

      //console.log($form);

      $form.find('input[type="text"],textarea').each(function(fk, fv){
        $(fv).removeAttr("required").after($(err));
      });
      $form.submit(function(){
        fields = [];
        $form.find('input[type="text"],textarea').each(function(fk, fv){
          valArr[fk] = $(fv).val();
          fields.push('{"title":"' + ($(fv).data('pk_form_title') ? $(fv).data('pk_form_title') : $(fv).attr('name')) + '","value":"' + $(fv).val().replace(/\n/g, " ") + '"}');
          if( $(fv).val() == "" && $(fv).hasClass('no_required') == false){
            state[fk] = false;
            $(fv).next('.error_message').fadeIn(100);
          }else{
            if( $(fv).hasClass('inn') && $(fv).val() != "" ){
              $(fv).next('.error_message').html('Неправильный формат ИНН');
              if(validInn($(fv).val())){
                state[fk] = true;
              }else{
                state[fk] = false;
                $(fv).next('.error_message').fadeIn(100);
              }
            }else if( $(fv).hasClass('email') && $(fv).val() != "" ){
              $(fv).next('.error_message').html('Неправильный формат эл. почты');
              if( regEmail.test($(fv).val()) ){
                state[fk] = true;
              }else{
                state[fk] = false;
                $(fv).next('.error_message').fadeIn(100);
              }
            }else{
              state[fk] = true;
            }
          }
        });

        $form.find('input[type="text"],textarea').keyup(function(){
          if( $(this).val() != "" ){
            $(this).next('.error_message').fadeOut(100);
          }else{
            $(this).next('.error_message').fadeIn(100);
          }
        });
        $form.find('input[type="text"],textarea').blur(function(){
          if( $(this).val() != "" ){
            $(this).next('.error_message').fadeOut(100);
          }else{
            $(this).next('.error_message').fadeIn(100);
          }
        });
        
        for (var i=0; i <= state.length; ++i){
          if(state[i] == false){
            return false;
          }
        };
        
        if($form.hasClass('confirm')){
          openConfirmWin(valArr, $form);
          return false;
        }
        
     /*   $.ajax({
          url: '/call.php',
          xhrFields: {
            withCredentials: true
          },
          data: {'fields': '[' + fields.join(',') + ']', 'callback': options.callback, 'referer': window.location.href },
          dataType: 'jsonp',
          crossDomain: true,
          type: 'POST'
        }).done(function(data){
          
        });*/
        options.callback();
        return false;
      });
    });
  };
  $.fn.reviews = function (options) {
    var _this = this;
    options = $.extend(true, {
      template: '<div class="reviews_item"><div class="reviews_txt">:comment:</div><b class="reviews_author">:name:</b></div>',
      callback: 'void(0);'
    }, options);
    var json = $.parseJSON('[]');
    $.each(json, function(k, v){
      $(_this).append(options.template.replace(':comment:', v.comment).replace(':name:', v.name).replace(':city:', v.city));
    });
    options.callback();
  };
  $.fn.phones = function (options) {
    $(this).html('8 (347) 275-66-55');
  };
})(jQuery);