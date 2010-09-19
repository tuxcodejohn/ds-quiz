$(window).bind('load', function() {
    $('#game').hide();
    $('#scoreboard').hide();

    $('#setup').show();
    $('#start').bind('click', startQuiz);
});

var playerNames = [];

function startQuiz() {
    var i;
    console.log('startQuiz');
    for(i = 0; i < 5; i++)
	playerNames[i] = $('#playername' + i).val();

    console.log(JSON.stringify(playerNames));

    return false;  // don't submit <form>
}
