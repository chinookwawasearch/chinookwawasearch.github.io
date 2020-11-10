// startup script -- hook entries.

var load_block = true;

$(function() {
    $('#search').keypress(function (e) {
        if (e.which == 13) {
            if (!load_block) do_search();
            return false;    // prevent default
        }
    });

    $("#search-direction").on("change", function(e) {
        if (!load_block) do_search();
    })
})

$(document).ready(function() {
    load_block = false;

    read_url_params(); // loads data from url

    do_search();
})