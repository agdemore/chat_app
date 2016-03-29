var $ = require('jquery');

$(document).on('click', "li.message", function() {
    var height = $('div.right-menu').height();
    $('.right-menu').scrollTop(height)
});
