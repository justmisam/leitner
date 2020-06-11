const db = new DB(function() {
    $(document).ready(function() {
        autoGrow($("#front")[0]);
        autoGrow($("#back")[0]);

        $("#add").click(function () {
            var front = $("#front").val();
            if (front == "") {
                alert("Front is empty!");
                return;
            }
            var back = $("#back").val();
            if (back == "") {
                alert("Back is empty!");
                return;
            }
            db.add(front, back);
            db.save();
            $("#front").val("");
            autoGrow($("#front")[0]);
            $("#back").val("");
            autoGrow($("#back")[0]);
            alert("Added.");
        });
    });
});
