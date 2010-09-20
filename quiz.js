$(window).bind('load', function() {
    $('#game').hide();
    $('#scoreboard').hide();

    loadQuizData(function() {
	// Quiz data has initialized
	$('#setup').show();
	$('#start').bind('click', function() {
	    try {
		startQuiz();
	    } catch (e) {
		console.error(e.stack);
	    }
	    return false;  // don't submit <form>
	});
    });
});

var questions;
var currentQuestion = 0;

function loadQuizData(done) {
    $.ajax({ url: 'data/questions.json',
	     contentType: 'json',
	     success: function(data, status) {
		 if (typeof data === 'string')
		     data = JSON.parse(data);

		 console.log(status);
		 questions = data;
		 done();
	     },
	     error: function(req, status, e) {
		 console.error(status);
		 console.log(e.stack);
	     }
	   });
}

var playerNames = [];

function startQuiz() {
    var i;
    console.log('startQuiz');

    questions.forEach(function(q) {
	$('#tiers').append('<li></li>');
	$('#tiers li').last().text(q.tier);
    });

    for(i = 0; i < 5; i++) {
	var name = $('#playername' + i).val();
	if (!name)
	    continue;  // skip empty players

	playerNames[i] = name;
	$('#scoreboard dl').append('<dt></dt><dd>0</dd>');
	$('#scoreboard dl dt').last().text(name);
	$('#players').append('<li class="player'+i+'"><span class="name"></span><span class="score">0</span></li>');
	$('#players li.player'+i+' span.name').text(name);
    }

    $('#setup').fadeOut(100, function() {
	switchToScoreboard();
    });
}

function switchToScoreboard() {
    $('#scoreboard').fadeIn(300, function() {
    });
}