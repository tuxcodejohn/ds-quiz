var keyHandler;
$(document).bind('keydown', function(event) {
    if (keyHandler)
	keyHandler(String.fromCharCode(event.keyCode));
});

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

var playerNames = [], playerScores = [];

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
	playerScores[i] = 0;
	$('#scoreboard dl').append('<dt></dt><dd>0</dd>');
	$('#scoreboard dl dt').last().text(name);
	$('#players').append('<li class="player'+i+'"><span class="name"></span><span class="score">0</span></li>');
	$('#players li.player'+i+' span.name').text(name);
    }

    $('#setup').fadeOut(700, function() {
	switchToScoreboard();
    });
}

function switchToScoreboard() {
    keyHandler = function(key) {
	if (key === ' ') {
	    $('#scoreboard').fadeOut(500, function() {
		switchToGame();
	    });
	}
    };

    $('#scoreboard').fadeIn(300);
}

// Game screen is the one with the question in question
function switchToGame() {
    var i, q = questions[currentQuestion];

    $('#tier').text(q.tier);

    $('#question').empty();
    if (q.text) {
	$('#question').append('<p></p>');
	$('#question p').text(q.text);
    }

    for(i = 0; i < 4; i++) {
	var answer = q.answers[i];
	var li = $('#answers li').eq(i);
	li.text(answer.text);
    }

    keyHandler = function(key) {
    };

    // Instantly show the question:
    $('#game').show();
}
