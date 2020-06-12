function filter(text) {
    var i = 0;
    $("#list ul").html("");
    db.getAll(text, function(card) {
        i++;
        $("#list ul").append("<li><a href=\"./edit.html#" + card.id + "\">" + card.front + "<span class=\"tip\">" + card.box + "</span></a></li>");
    }, function() {
        if (i == 0) {
            $("#list ul").html("<br/>List is empty!");
        }
    });
}

const db = new DB(function() {
    $(document).ready(function() {
        filter("");

        $("#search").on("change keyup", function() {
            filter($(this).val());
        });
    });
});
