<?php
error_reporting(E_ALL);
ini_set('display_errors', '1');
?>
<!doctype html>
<!--[if lt IE 7]>
<html class="no-js lt-ie9 lt-ie8 lt-ie7" lang="en"> <![endif]-->
<!--[if IE 7]>
<html class="no-js lt-ie9 lt-ie8" lang="en"> <![endif]-->
<!--[if IE 8]>
<html class="no-js lt-ie9" lang="en"> <![endif]-->
<!--[if gt IE 8]><!-->
<html class="no-js" lang="en" xmlns="http://www.w3.org/1999/html"> <!--<![endif]-->
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
    <title>Evolution Concept</title>
    <meta name="description" content="">

    <meta name="viewport"
          content="width=device-width, initial-scale=1.0, user-scalable=no">
    <link href='http://fonts.googleapis.com/css?family=Lobster' rel='stylesheet' type='text/css'>
    <link rel="stylesheet" href="css/style.css" type="text/css" media="screen">
    <link rel="stylesheet" href="css/nivo-slider.css" type="text/css" media="screen">
    

    <script src="js/libs/modernizr-2.5.3.min.js"></script>

</head>
<body>
    <section id="intro" class="fullSplash">
    <div id="browser_support">The game performs best in <a href="http://www.mozilla.org/en-US/firefox/" title="Mozilla Firefox">Mozilla Firefox</a>.
    </div>
    <div class="welcome_text">
        <header>
            <h1>Selfish</h1>
        </header>
        <p class="welcome_text_body">
            This so welcome text
        </p>
        <button class="btn btn-large btn-info show_tutorial" type="button">Tutorial</button>
        <button class="btn btn-large btn-info get_started" type="button">Get Started</button>
    </div>
	<div class="tutorial slider-wrapper theme-default hide">
			<header>
				<h1>Selfish Tutorial</h1>
			</header>
            <div id="slider" class="nivoSlider">
                <img src="images/SelectedBaby.png" class="help_selected_baby" title="The circle 'Halo' around a fish, means this is your controlled fish." alt="" />
                <img src="images/SelectedAdult.png" class="help_selected_adult" alt="" title="After 15 seconds all fish turn into adults. The fishes immunities are layed out around the fish." />
                <img src="images/Click.png" class="help_click" title="You can control your fish by clicking on a location." />
                <img src="images/Controls.png" class="help_controls" alt="" title="This is how you can tell your fish what decision to make." />
                <img src="images/Stats.png" class="help_stats" alt="" title="You can see your current statistics here." />
                 <img src="images/MaleFish.png" class="help_male_fish" alt="" title="Male fish look like this. You can out cross with one by clicking 'out cross' in the controls and bumping into them." />
                 <img src="images/InfectedFish.png" class="help_infected_fish" alt="" title="Fish will get infected if you go to close to pathogens you are not immune to." />
            </div>
            <button class="btn btn-large btn-info get_started" type="button">Get Started</button>
    </div>
        <form action="" class="form-horizontal nameForm hide">
            <div class="control-group">
                <label class="control-label" for="yourName">Name</label>
                <div class="controls">
                    <input class="input your_name" placeholder=" Enter Your Name" id="yourName" size="16" type="text" />
                </div>
            </div>
            <div class="control-group">
                <label class="control-label" for="yourAge">Your age</label>
                <div class="controls">
                    <input class="input your_age" placeholder=" Enter Your Age" id="yourAge" size="16" type="text"/>
                </div>
            </div>
            <div class="control-group">
                <label class="control-label" for="yourGender">Your Gender</label>
                <div class="controls">
                    <select id="yourGender">
                        <option>Male</option>
                        <option>Female</option>
                    </select>
                </div>
            </div>
            <button class="btn btn-block btn-large btn-primary playAgain startUpData" type="button">Play</button>
        </form>
    </section>

    <section id="help">
        <header class="blueGradient mainTitle">
	        <h1>Selfish</h1>
            <small>A new Student E-Learning Tool For Investigating Selection Hypotheses</small>
        </header>

        <div class="content">
                <h1 class="help">Help</h1>
                <hr />
                <h2 class="objective">Objective</h2>
                <p class="objective_text">The aim of the game is to grow your fish population to the largest size it can, in the allotted time provided.</p>
                <h2 class="controls_title">Controls</h2>
                <h3 class="movement">Movement</h3>
                <p class="movement_text">To move you fish, simply click on the destination you want the fish to go to.</p>
                <h3 class="breeding">Breeding</h3>
                <p class="breeding_text">To breed either click (in the right menu) 'self' or click 'out cross' and find a male.</p>
        </div>
        <div class="content">
            <h1 class="faq">FAQ</h1>
            <hr />
            <h3 class="where_parents">Wheres my parent gone?</h3>
            <p class="where_parents_text">Once an adult gives birth the parent disappears. This does not affect your fish population, don't worry.</p>
            <h3 class="running_slow">Why is it running slowly?</h3>
            <p class="running_slow_text">Try adjusting the graphics setting in the right menu to boost performance.</p>
            <h3 class="population_down">Why does my population number go down?</h3>
            <p class="population_down_text">Randomly the game removes fish from your population, due to natural causes.</p>
        </div>
        <div class="content">
            <h1 class="credits">Credits</h1>
            <hr />
            <h3 class="music">Music</h3>
            <p><a href="http://incompetech.com/m/c/royalty-free/" title="Kevin MacLeod">Kevin MacLeod</a></p>
        </div>
    </section>

    <canvas id="backgroundCanvas" class="canvas"></canvas>
    <div class="shadow full"></div>

    <canvas id="mainCanvas" class="canvas">
        <p class="not_supported">Your browser does not support HTML5 Canvas.</p>
    </canvas>


    <section id="pause" class="splash">
        <h1 class="paused_game">The game has been paused.</h1>
    </section>

    <section id="end" class="fullSplash">
        <div class="info">
            <header>
        	    <h1 class="game_over">Game Over</h1>
            </header>
        	<ul>
        		<li class="numFish"><span class="title total_fish">Total Number of Fish</span><span class="result">0</span></li>
        		<li class="numGenerations"><span class="title total_generations">Total Number of Generations</span><span class="result">0</span></li>
                <li class="numDirPopulation"><span class="title total_direct">Total Number of Direct Fish</span><span class="result">0</span></li>
        	</ul>
            <form action="" class="form-horizontal nameFormEnd">
                <input class="input" placeholder=" Enter Your Name" id="appendedInputButton" size="16" type="text" />
                <button class="btn btn-large btn-primary playAgain" type="button">Play Again</button>
            </form>
        </div>
        <div id="sidebar">
            <header class="blueGradient">
                <h1 class="highscores_text">Highscores</h1>
            </header>
            <div class="inner">
                <div class="highscores">
                    <ul>
                    <?php include 'php/ajax/getScores.php'; ?>
                    </ul>
                </div>
            </div>
        </div>
    </section>

    <script src="//ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js"></script>
    <script>window.jQuery || document.write('<script src="js/libs/jquery-1.7.2.min.js"><\/script>')</script>
    <script src="js/libs/jquery.idle.timer.js"></script>
    <script src="js/libs/localisation.js"></script>
    <script src="js/libs/dat.gui.js"></script>
    <script src="js/libs/smoke.js"></script>
    <script src="js/libs/jquery.nivo.slider.pack.js"></script>
    <script type="text/javascript">
    $(window).load(function() {
        $('#slider').nivoSlider({
	        effect: 'fade',
	        controlNav: false,
	        directionNavHide: false,
	        pauseTime: 8000,
	        slices: 1, // For slice animations
	        boxCols: 1, // For box animations
	        boxRows: 1
        });
    });
    </script>

    <script src="js/plugins.js"></script>
    <script src="js/script.js"></script>
    

</body>
</html>