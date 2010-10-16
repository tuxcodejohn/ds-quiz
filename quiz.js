if (!window.console) {
    var stub = function() { };
    window.console = { log: stub, error: stub, warn: stub };
}

var keyHandler;
$(document).bind('keydown', function(event) {
    console.log('cc: '+event.charCode+'/'+String.fromCharCode(event.keyCode).toLowerCase()+' kc: '+event.keyCode);
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

var playerNames = [], playerScores = [], playerJokers = [];

function startQuiz() {
    var i;
    console.log('startQuiz');

    questions.forEach(function(q) {
        $('#tiers').append('<li></li>');
        $('#tiers li').last().text(q.tier);
    });

    for(i = 0; i < 5; i++) {
        var name = $('#playername' + i).val();
        if (name) {
            playerNames[i] = name;
            playerScores[i] = 0;
            $('#scoreboard dl').append('<dt></dt><dd><span class="score">0</span><img src="fiftyfifty.png" class="fiftyfifty"><img src="audience.png" class="audience"><img src="phone.png" class="phone"></dd>');
            $('#scoreboard dl dt').last().text(name);
            $('#players').append('<li class="player'+i+'"><span class="name"></span><span class="score">0</span></li>');
            $('#players li.player'+i+' span.name').text(name);
        }
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

    for(var i = 0; i < currentQuestion; i++) {
	$('#tiers li').eq(i).addClass('done');
    }

    $('#scoreboard').fadeIn(300);
}

function updateScores() {
    for(var i = 0; i < playerNames.length; i++) {
        if (playerNames[i]) {
	    // FIXME: eq(i) is bad when first player is empty
	    $('#scoreboard dl dd').eq(i).find('.score').text(playerScores[i]);
            $('#players .player'+i+' .score').text(playerScores[i]);
	}
    }
}

function takeJoker(activePlayer, joker) {
    if (activePlayer === null)
	// No active player
	return;

    if (!playerJokers.hasOwnProperty(activePlayer))
	playerJokers[activePlayer] = {};

    if (playerJokers[activePlayer][joker])
	// Joker already taken
	return;

    playerJokers[activePlayer][joker] = true;
    $('#tier').append('<img src="' + joker + '.png">');
    $('#scoreboard dd').eq(activePlayer).find('.' + joker).remove();

    if (joker === 'fiftyfifty') {
	var h1, h2, answers = questions[currentQuestion].answers;
	do {
	    h1 = Math.floor(Math.random() * 4);
	    h2 = Math.floor(Math.random() * 4);
	} while(answers[h1].right || answers[h2].right || h1 === h2);
	$('#answer' + h1).fadeTo(500, 0.1);
	$('#answer' + h2).fadeTo(500, 0.1);
    }
}

// Game screen is the one with the question in question
function switchToGame() {
    var i, q = questions[currentQuestion];
    var activePlayer = null, choice = null;  // can be null

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
    if (q.image) {
        $('#question').append('<img>');
        $('#question img').attr('src', q.image);
    }
    if (q.video) {
        $('#question').append('<video controls autoplay>');
        $('#question video').attr('src', q.video);
    }

    for(i = 0; i < 4; i++) {
        var answer = q.answers[i];
        var liEl = $('#answers li').eq(i);
        liEl.text(answer.text);
        liEl.removeClass('selected right wrong');
	liEl.fadeTo(0, 1);
    }

    keyHandler = function(key, keyCode) {
        if (keyCode === 27) {
            // Shortcut: cancel this state
            $('#game').hide();
            switchToScoreboard();
        } else if (activePlayer === null &&
		   "abcde".indexOf(key) >= 0) {
            // No active player yet, but somebody hit a button!
            var player = "abcde".indexOf(key);
            if (playerNames[player]) {
                activePlayer = player;
		updateTier();
	    }
        } else if (activePlayer !== null &&
                   "1234".indexOf(key) >= 0) {
            // player pronounced the answer
            if (choice !== null)
                $('#answer' + choice).removeClass('selected');

            choice = "1234".indexOf(key);
            $('#answer' + choice).addClass('selected');
        } else if (activePlayer !== null &&
                   keyCode === 13) {
            // player confirmed answer or gave up
            var answerEl;
            if (choice !== null) {
                answerEl = $('#answer' + choice);
                answerEl.removeClass('selected');
            }
            var isRight = choice !== null && q.answers[choice].right === true;
            if (isRight) {
                playerScores[activePlayer] += q.tier;
                updateScores();
            } else {
		playerScores[activePlayer] -= q.tier;
                updateScores();

		if (choice !== null)
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
                    $('#game').fadeOut(500, function() {
                        switchToScoreboard();
		    });
		}
	    };
	} else if (activePlayer !== null &&
		   key === 'q') {
	    takeJoker(activePlayer, 'fiftyfifty');
	} else if (activePlayer !== null &&
		   key === 'w') {
	    takeJoker(activePlayer, 'audience');
	} else if (activePlayer !== null &&
		   key === 'e') {
	    takeJoker(activePlayer, 'phone');
	}
    };

    // Instantly show the question:
    $('#game').show();
}
