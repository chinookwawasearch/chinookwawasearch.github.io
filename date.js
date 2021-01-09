$.get( "/date.txt", function( date ) {
    $( "#date-text" ).html( "Updated " + date );
});