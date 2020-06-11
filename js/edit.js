const db = new DB(function() {
    $(document).ready(function() {
        var id = location.hash.substr(1);

        try {
            var card = db.get(id);
            $("#front").val(card.front);
            $("#back").val(card.back);
            $("#reset").text($("#reset").text().replace("#", card.box));
            autoGrow($("#front")[0]);
            autoGrow($("#back")[0]);
        } catch(err) {
            alert(err);
            window.close();
        }

        $("#edit").click(function () {
            var id = location.hash.substr(1);
            var front = $("#front").val();
            var back = $("#back").val();
            db.edit(id, front, back);
            db.save();
            alert("Edited.");
        });
    
        $("#reset").click(function () {
            var id = location.hash.substr(1);
            db.reset(id);
            db.save();
            $("#reset").text($("#reset").text().replace("#", 1));
            alert("Reset.");
        });
    });
});

function remove() {
    if (db.isReady) {
        var id = location.hash.substr(1);
        db.remove(id);
        db.save();
        window.location.href = "./index.html";
    }
}
