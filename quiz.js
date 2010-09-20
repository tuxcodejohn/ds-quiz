var keyHandler;
$(document).bind('keydown', function(event) {
    if (keyHandler)
        keyHandler(String.fromCharCode(event.keyCode).toLowerCase(), event.keyCode);
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

function updateScores() {
    for(var i = 0; i < playerNames.length; i++) {
        if (!playerNames[i])
            continue;

        $('#scoreboard dl dd').eq(i).text(playerScores[i]);
        $('#players .player'+i+' .score').text(playerScores[i]);
    }
}

// Game screen is the one with the question in question
function switchToGame() {
    var i, q = questions[currentQuestion];
    var activePlayer = null, choice = null;

    var updateTier = function() {
        var s = q.tier;
        if (activePlayer !== null)
            s += ' — ' + playerNames[activePlayer];
        $('#tier').text(s);
    };
    updateTier();

    $('#question').empty();
    if (q.text) {
        $('#question').append('<p></p>');
        $('#question p').text(q.text);
    }

    for(i = 0; i < 4; i++) {
        var answer = q.answers[i];
        var liEl = $('#answers li').eq(i);
        liEl.text(answer.text);
	liEl.removeClass('selected right wrong');
    }

    keyHandler = function(key, keyCode) {
	if (keyCode === 27) {
            // Shortcut: cancel this state
            $('#game').hide();
            switchToScoreboard();
        } else if (activePlayer === null &&
            key > 0 && key <= playerNames.length) {
            // No active player yet, but somebody hit a button!
            activePlayer = parseInt(key, 10) - 1;
            updateTier();
        } else if (activePlayer !== null &&
                   "abcd".indexOf(key) >= 0) {
            // player pronounced the answer
            if (choice !== null)
                $('#answer' + choice).removeClass('selected');

            choice = "abcd".indexOf(key);
            $('#answer' + choice).addClass('selected');
        } else if (activePlayer !== null &&
                   keyCode === 13) {
	    // player confirmed answer or gave up
	    var answerEl;
	    if (choice) {
		answerEl = $('#answer' + choice);
		answerEl.removeClass('selected');
	    }
            var isRight = choice !== null && q.answers[choice].right === true;
            if (isRight) {
                playerScores[activePlayer] += q.tier;
		updateScores();
	    } else if (choice) {
		// Hilight the wrong choice
		answerEl.addClass('wrong');
	    }
	    // Hilight all right choices
	    var i = 0;
	    q.answers.forEach(function(answer) {
		if (answer.right === true)
		    $('#answer' + i).addClass('right');
		i++;
	    });

	    keyHandler = function(key) {
		if (key === " ") {
		    // next question:
		    currentQuestion++;
		    $('#game').fadeOut(500);
		    switchToScoreboard();
		}
	    };
	}
    };

    // Instantly show the question:
    $('#game').show();
}
