(function() {
var app = {
    scrollPosition: 0
  };

  $('.right_column').append('<div id="post_Savr_container"><ul class="ps_list controls_section"><li class="section_header account_header">PostSavr</li><li class="section_header account_header none" id="clearDash">Clear saved posts</li></ul></div>');
  localforage.getItem('postSavr_tags', function(postSavr_tags) {
    var list = '';
    $.each(postSavr_tags, function(key, value) {
      var tag = "<li class='ps_list_item'>" +
                  "<div class='tag_wrap' href='#'>"+
                    "<div class='hide_overflow'>"+
                    " <a class='ps_tag'>" + key + "</a>"+
                    "<span  data-tag="+key+" class='ps_delete_tag'> X</span>"+
                    "<span data-length_for='" + key.replace(/\s/g, '_') + "' class='tag_length'> " + postSavr_tags[key].post_ids.length + "</span>"+
                    "</div>"+
                  "</div>"+
                "</li>";
      list += tag;
    });
    $('#clearDash').before(list);
  });

  $('body').on('mouseover', '.like', function() {
    var $this = $(this),
      pos = $this.position(),
      x = pos.left - 100,
      y = pos.top - 25,
      input = '<input type="text" placeholder="Comma sperated tags" style=" display: none; position: absolute; top: ' + y + 'px; left: ' + x + 'px; " class="tagInput" name="inputValue" size="20" >';
    if ($('.tagInput').length <= 0) {
      $this.closest('.post').append(input);
      $('.tagInput').fadeIn('fast', function() {
        $(this).focus();
      });
    }
  });

  $('body').on('click', '.like', function() {
    var $this = $(this),
    post = $this.closest('.post'),
    inputValue = $('.tagInput').val();
    //$this.addClass('liked');
    $('.tagInput').remove();
    $('.post_animated_heart').remove();

    post.find('.post_controls_inner').find('.ps_remove').remove();
    post.find('.post_controls_inner').append('<a href="#" class="post_control ps_remove" title="Remove post from tag"></a>');
    post.find('.post_controls_inner').find('.xkit-interface-control-button').remove();
    submitValues(post, inputValue);
    post.find('.post_controls_inner').find('.ps_remove').remove();


  });

  $('body').on('mouseleave', '.post', function() {
    $('.tagInput').fadeOut('fast', function() {
      this.remove();
    });
  });

  $('body').on('keyup', '.tagInput', function(e) {
    if (e.keyCode == 13) {
      var post = $(this).closest('.post'),
      inputValue = $('.tagInput').val();
      $('.tagInput').remove();

      if(inputValue === '') return;
       post.find('.post_controls_inner').find('.ps_remove').remove();
      post.find('.post_controls_inner').append('<a href="#" class="post_control ps_remove" title="Remove post from tag"></a>');
      post.find('.post_controls_inner').find('.xkit-interface-control-button').remove();
      submitValues(post, inputValue);
      post.find('.post_controls_inner').find('.ps_remove').remove();
    }
  });


  $('body').on('click', '.ps_tag', function(e) {
    e.preventDefault();
    $('[data-postSavr~=true]').remove();

    var $posts = $('#posts'),
    index = 0;
    tag = $(this).text();
    app.tag = tag;
    app.index = 0;
    $('.highlight').removeClass('highlight');
    $(this).addClass('highlight');
    $('#clearDash').removeClass('none');

    renderPosts(tag)

  });

  $('body').on('click', '#load_more', function() {
    renderPosts(app.tag);
  });

  function renderPosts(tag) {

    var load_more = '<li class="post_container" id="load_more"><div>LOAD MORE SAVED POSTS</div></li>'
    var $posts = $('#posts');
    localforage.getItem('postSavr_tags', function(postSavr_tags) {
      var arr = postSavr_tags[tag].root_ids;
      if(arr.length > 10) {
        if(arr.length > 10 && $('#load_more').length <= 0) {
          if ($('#new_post_buttons').length > 0) {
            $('#new_post_buttons').after(load_more);
          }
          else {
           $posts.prepend(load_more);
          }
        }
        var index = app.index % arr.length || 0;
        // save next index - for next call
        app.index += 10;
        $.map(arr.slice(index, index + 10), function(root_id) {
          localforage.getItem('p_s'+root_id, function(html) {
            $('#load_more').before($(html));
            var count = $('[data-postSavr~=true]').length;
            if(count >= arr.length ){
              $('#load_more').remove();
              return;
            }
          });
        });
      }
      else {
        postSavr_tags[tag].root_ids.reverse().forEach(function(root_id) {
        localforage.getItem('p_s'+root_id, function(html) {
          if ($('#new_post_buttons').length > 0) {
            $('#new_post_buttons').after($(html));
          }
          else {
           $posts.prepend($(html));
          }
        });
      });
      }
    })
  }

  $('body').on('click', '.ps_remove', function(e) {
    e.preventDefault();
    var post = $(this).closest('.post'),
    root_id = post.data('root-id');

    localforage.getItem('postSavr_tags', function(postSavr_tags) {

      var tag = postSavr_tags[app.tag],
       index = tag.root_ids.indexOf(root_id);

      tag.root_ids.splice(index, 1);
      tag.blog_names.splice(index, 1);
      tag.post_ids.splice(index, 1);

      localforage.removeItem('p_s'+root_id);

      if(tag.root_ids.length ===0) {
        delete postSavr_tags[app.tag];
      }

      localforage.setItem('postSavr_tags', postSavr_tags, function() {
        post.remove();
        updateCount(app.tag, -1);
      });

    });
  });

  $('body').on('click', '.ps_delete_tag', function() {
    var parent = $(this).closest('.ps_list_item');
    parent.remove();

    var tag = $(this).data('tag');
    localforage.getItem('postSavr_tags', function(postSavr_tags) {
      var _tag = postSavr_tags[tag];
      _tag.root_ids.forEach(function(root_id) {
        localforage.removeItem('p_s'+root_id);
      });
      delete postSavr_tags[tag];
      localforage.setItem('postSavr_tags', postSavr_tags, function() {
        parent.remove();
      });
    });
  });


  $('body').on('click', '#clearDash', function() {
    $(this).addClass('none');
    $('[data-postSavr~=true]').remove();
    $('.highlight').removeClass('highlight');
    $('.selected').removeClass('selected')
  });


  function submitValues(post, inputValue) {
    console.log(inputValue);
    if(inputValue === '') return;



    var tags = inputValue.split(','),
    root_id = post.data('root-id'),
    post_id = post.data('post-id'),
    blog_name = post.data('tumblelog-name'),
    html = post.closest('.post')[0].outerHTML;
    $('.tagInput').remove();
    tagPosts(tags, root_id, post_id, blog_name);
    saveHtml(root_id, html);
  }

  function tagPosts(tags, root_id, post_id, blog_name) {
    localforage.getItem('postSavr_tags', function(e) {
      var postSavr_tags = e || {};
      tags.forEach(function(tag) {
        tag = tag.trim();
        if (postSavr_tags[tag] === undefined) {
          var tag_item = "<li class='ps_list_item'>" +
                  "<div class='tag_wrap' href='#'>"+
                    "<div class='hide_overflow'>"+
                    " <a class='ps_tag'>" + tag + "</a>"+
                    "<span  data-tag="+tag+" class='ps_delete_tag'> X</span>"+
                    "<span data-length_for='" + tag.replace(/\s/g, '_')  + "' class='tag_length'>1</span>"+
                    "</div>"+
                  "</div>"+
                "</li>";
          $('#clearDash').before(tag_item);
          postSavr_tags[tag] = {
            post_ids: [post_id],
            blog_names: [blog_name],
            root_ids: [root_id]
          };
        }
        else {
          if (postSavr_tags[tag].root_ids.indexOf(root_id) >= 0) {
          } else {
            updateCount(tag, 1);
            postSavr_tags[tag].blog_names.unshift(blog_name);
            postSavr_tags[tag].post_ids.unshift(post_id);
            postSavr_tags[tag].root_ids.unshift(root_id);
          }
        }
      });
      localforage.setItem('postSavr_tags', postSavr_tags, function() {
        $('#container').append('<div id="saveDone" class="">Saved to: ' + tags+'</div>');
        $('#saveDone').fadeIn(250, function() {
          var self = $(this);
            $(this).delay(500).fadeOut(250, function() {
              self.remove();
          });
        });
      });
    });
  }

  function saveHtml(root_id, html) {
    html = '<li class="post_container" data-postSavr="true">' + html + '</li>';
    localforage.setItem('p_s'+root_id, html, function(e) {});
  }

  function updateCount(tag, incrementor) {
    tag = tag.replace(/\s/g, '_');
    var newval = parseInt($('[data-length_for~=' + tag + ']').text(), 10) + incrementor;
    if (newval < 1) {
      $('[data-length_for~=' + tag + ']').closest('.ps_list_item').remove();
    }
    $('[data-length_for~=' + tag + ']').text(newval);
  }

  var shrtcutHtml = '<div id="shrtct_container"><ul id="shrtct_list"><li class="shrtct"><a href="#" class="shrtct_click">Text</a></li><li class="shrtct"><a href="#" class="shrtct_click">Photo</a></li><li class="shrtct"><a href="#" class="shrtct_click">Quote<li class="shrtct"><a href="#" class="shrtct_click">Link</a></li></a></li><li class="shrtct"><a href="#" class="shrtct_click">Chat</a></li><li class="shrtct"><a href="#" class="shrtct_click">Audio</a></li><li class="shrtct"><a href="#" class="shrtct_click">Video</a></li></ul></div>';
  $('body').append(shrtcutHtml);

  $('body').on('click', '.shrtct_click', function(e) {
    e.preventDefault();
    var self = this;
    //new_post_label_text
    var _selector = '#new_post_label_'+$(self).text().toLowerCase();

    document.querySelector(_selector).click();
    app.scrollPosition = $(window).scrollTop();
    $(window).scrollTop(0);
  });

  $('body').on('submit', '#post_form', function(e) {
    console.log(e);
    setTimeout(function() {
      $(window).scrollTop(app.scrollPosition);
    }, 3750)
  });

  $('body').on('click', '.close', function() {
    $(window).scrollTop(app.scrollPosition);
  });


})();




