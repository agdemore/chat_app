var $ = require('jquery');

var originWidth = 900;
var originHeight = 800;

$(document).on('click', "li.message", function() {
    var height = $('div.right-menu').height();
    $('.right-menu').scrollTop(height)
    if ($(window).width() < originWidth) {
        $('.left-menu').addClass('hide-element');
        $('.nav-expand').toggleClass('open');
    }

});

// to display chat window on start
var appWidth = $(window).width();
if (appWidth == originWidth) {
    $('.show-left-menu').show();
} else if (appWidth > originWidth) {
    $('.show-left-menu').show();
} else if (appWidth < originWidth) {
    $('.show-left-menu').hide();
}


$(window).resize(function() {
    var wWidth = $(window).width();
    if (wWidth < 870) {
        $('.left-top').addClass('hide-element');

        $('.left-menu').addClass('hide-element');

        $('.right-top').addClass('right-top-min');

        $('.right-menu').addClass('right-menu-min');

        $('.show-left-menu').show();
    } else if (wWidth >= 900) {
        if ($('.left-top').hasClass('hide-element'))
            $('.left-top').removeClass('hide-element');
        if ($('.left-menu').hasClass('hide-element'))
            $('.left-menu').removeClass('hide-element');
        if ($('.right-top').hasClass('right-top-min'))
            $('.right-top').removeClass('right-top-min');
        if ($('.right-menu').hasClass('right-menu-min'))
            $('.right-menu').removeClass('right-menu-min');
        $('.show-left-menu').hide();
    }
});

$('.show-left-menu').click(function() {
    $('.left-menu').toggleClass('hide-element');
});
$(".nav-expand").on('click', function(e){

  e.preventDefault();

  $(this).toggleClass('open');

});
