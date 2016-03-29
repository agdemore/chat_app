var $ = require('jquery');

$(document).on('click', "li.message", function() {
    var height = $('div.right-menu').height();
    $('.right-menu').scrollTop(height)
});

$(window).resize(function() {
    var wWidth = $(window).width();
    if (wWidth < 1100) {
        $('.left-top').addClass('hide-element');

        $('.left-menu').addClass('hide-element');

        $('.right-top').addClass('right-top-min');

        $('.right-menu').addClass('right-menu-min');

        $('.show-left-menu').show();
    } else if (wWidth >= 1200) {
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
