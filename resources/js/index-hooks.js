// startup script -- hook entries.

var load_block = true;
var no_read_url_params = false;

$(function() {
    $('#search').keypress(function (e) {
        if (e.which == 13) {
            if (!load_block) do_search();
            return false;    // prevent default
        }
        else
        {
            // set timeout to properly update text content first.
            if (!load_block) setTimeout(do_update, 0);
        }
    });

    $('#search').on("paste", function (e) {
        // set timeout to properly update text content first.
        if (!load_block) setTimeout(do_update, 0);
    });

    $("#search-direction").on("change", function(e) {
        no_read_url_params = true;
        // timeout is paranoia
        if (!load_block) setTimeout(do_search, 0);
    })

    $("#show-rude").change(function(e) {
        no_read_url_params = true;
        console.log("rudegloss:", show_rudegloss)
        show_rudegloss = !($(this).prop('checked'));
        if (show_rudegloss)
        {
            caution_hide = caution_hide_max
        }
        else
        {
            caution_hide = caution_hide_default
        }
        if (!load_block) do_update();
    })
})

function update_date()
{
    $.get( "/ci.json", function( ci ) {
        var s = "Updated"
        if (ci.status != "success")
        {
            s = "Update Error "
        }
        $( "#date-text" ).html( `${s} <a href="${ci["action-url"]}">${ci.date}</a>` );
    });
}

$(document).ready(function() {
    load_block = false;

    update_date()

    if ($("#search").val() && $("#search").val().trim() != "")
    {
        no_read_url_params = true;
    }

    if (!no_read_url_params) read_url_params(); // loads data from url

    do_update();
})