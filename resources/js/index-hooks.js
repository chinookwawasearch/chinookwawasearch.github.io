// startup script -- hook entries.

var load_block = true;
var no_read_url_params = false;

$(function() {
    $('#search').keypress(function (e) {
        if (e.which == 13) {
            if (!load_block) do_search();
            return false;    // prevent default
        }
    });

    $("#search-direction").on("change", function(e) {
        no_read_url_params = true;
        if (!load_block) do_search();
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

    do_search();
})