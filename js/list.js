var filterLock = false;

function filter(db, text) {
    if (filterLock) return;
    filterLock = true;
    var i = 0;
    $("#list ul").html("");
    db.search(text, function(card) {
        i++;
        $("#list ul").append("<li><a href=\"./edit.html#" + card.id + "\">" + card.front + "<span class=\"tip\">" + card.box + "</span></a></li>");
    }, function() {
        filterLock = false;
        if (i == 0) {
            $("#list ul").html("<br/>List is empty!");
        }
    });
}

$(document).ready(function() {
    window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;

    const db = new DB(function() {
        filter(db, "");

        $("#search").on("change keyup", function() {
            filter(db, $(this).val());
        });
    });
});
