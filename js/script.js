/*

 Evolution Concept

 @author Matthew Harrison-Jones

 */

$(document).ready(function(){

    // Canvas Settings
    var canvas = $("#mainCanvas");
    var context = canvas.get(0).getContext("2d");
    var canvasWidth = $(window).get(0).innerWidth;
    var canvasHeight = $(window).get(0).innerHeight;
    canvas.attr("width", canvasWidth);
    canvas.attr("height", canvasHeight);

    // Broswer Detection
    var is_firefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
    if(!is_firefox) $("#browser_support").show();

    // Language
    var language = new localisation("/js/text.json", false);
    function language_init(){
        if(language.checkLoaded()){
            language.setLanguage("auto");
            setText();
        }else{
            setTimeout(language_init, 400);
        }
    }
    language_init();

    // Game settings
    var playGame = false, paused = false, gameOver = false, muted = false, debug = false;

    // Control Settings
    var mouseX, mouseY, mousePressed = false, mouseAnim;

    // UI Settings
    var stats;
    var lastUpdateTime = 0;
    var acDelta = 0;
    var msPerFrame = 20;

    var countFrom;
    var countingTo = 900000; // 15 mins game duration

    var pauseTime = 0, pauseSet;

    var username = "";

    var firstInfection = true, firstBreed = true, firstControls = true; // Used to define new users


    // UI Elements
    var pauseSplash = $('#pause'), endSplash = $('#end'), helpMenu = $('#help');
    var slider = $('#intro').show();

    // Content Arrays
    var fishArray = [], familyArray = [], foodArray = [], pathogenArray = [];


    /**
     *
     * OBJECTS
     *
     */

    var Environment, Fish, Pathogen, Food, Mouse, Sprites, Sound; // Init Object Variables

    /**
     * Stats Graph Object
     * @return {Object}
     * @constructor
     */
    var StatsGraph = function(){
        var width = 300,
            height = 50,
            maxData = 0,
            minData = 0,
            data = [],
            dirData = [],
            fishPerSecond = 0;


        var addData = function(value){
            if(data.length == 150){
                data.shift(); // Remove first data
            }

            fishPerSecond = value - data[data.length - 1];

            data.push(value);
            maxData = data.max();

        };

        var addDirData = function(value){
            if(dirData.length == 150){
                dirData.shift(); // Remove first data
            }

            dirData.push(value);
        };

        var reset = function(){
            data = [];
            dirData = [];
        };

        var draw = function(ctx){
            ctx.save();
            ctx.translate(0, canvasHeight - height);
            ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
            ctx.fillRect(0, 0, width, height);

            ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
            ctx.font = "Bold 8px Verdana";
            ctx.fillText(minData, width + 4, height - 2);
            ctx.fillText(maxData, width + 4, 10);

            ctx.fillText(fishPerSecond + " fish/s", 4, 25);

            var d, dx, dy, dat, dataCount = data.length;
            if(dataCount > 0){
                ctx.strokeStyle = "rgb(0, 255, 0)";
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(width - (dataCount * 2), height - (data[0] / (maxData / height)));
                for(d = 0; d < dataCount; d++){
                    dat = data[d];
                    dx = (width - (dataCount * 2)) + (d * 2);
                    dy = height - (dat / (maxData / height));

                    ctx.lineTo(dx, dy);
                }
                ctx.stroke();
            }

            var dd, ddx, ddy, ddat, ddataCount = dirData.length;
            if(dataCount > 0){
                ctx.strokeStyle = "rgb(255, 135, 243)";
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(width - (ddataCount * 2), height - (dirData[0] / (maxData / height)));
                for(dd = 0; dd < ddataCount; dd++){
                    ddat = dirData[dd];
                    ddx = (width - (ddataCount * 2)) + (dd * 2);
                    ddy = height - (ddat / (maxData / height));

                    ctx.lineTo(ddx, ddy);
                }
                ctx.stroke();
            }
            ctx.restore();
        };

        return {
            addData:addData,
            addDirData:addDirData,
            draw:draw,
            reset:reset
        }
    };

    /**
     * Environment Object
     * @return {Object}
     * @constructor
     */
    Environment = function(){

        // Game Variables
        var numFish = 10;
        var numDeaths = 0;
        var directGens = 1;
        var directPop = 1;
        var popScale = 1;
        var realFishCount = 0;
        var dirDeaths = 0;
        var realDirPop = 0;
        var gens = 0;

        var numPathogens = 10;

        var temperature = 20;
        var naturalEndTime = 120000;
        var lastEndTime = +new Date();
        var lastStats = +new Date();
        var lastInject = +new Date();


        // Game options
        var chooseSelected = hackRound(Math.random() * numFish);
        var selectedFish = familyArray[0];
        var indicator = 0;
        var maxFish = 50;
        var numFood = 20;
        var birthCount = 10; // Half for herm
        var giveUp = 100000;

        // Game functions

        var calcStats = function(){
            if(this.realFishCount >= this.maxFish) this.populationScale = this.numFish / this.maxFish;
            this.realFishCount = (this.numFish - this.numDeaths) * this.populationScale;
            this.dirDeaths = hackRound((this.numDeaths / this.numFish) * 100); // Percent of deaths
            this.realDirPop = hackRound((this.directPop - hackRound(this.directPop / 100 * this.dirDeaths))) * this.populationScale;
        };

        /**
         * Play the game
         */
        var play = function(){

            if(playGame != true){
                backSound.play();
                endSplash.hide();
                slider.hide();
                var pathoType = hackRound(randomFromTo(1, 5));
                while(pathogenArray.length < numPathogens){
                    var x = hackRound(Math.random() * canvasWidth);
                    var y = hackRound(Math.random() * canvasHeight);

                    pathogenArray.push(new Pathogen(x, y));
                }
                while(fishArray.length < numFish){
                    var x = hackRound(Math.random() * canvasWidth);
                    var y = hackRound(Math.random() * canvasHeight);
                    var rndm = hackRound(randomFromTo(0, 3));
                    var immunities = [0, 0, 0, 0];
                    immunities[rndm] = hackRound(randomFromTo(1, 5));
                    fishArray.push(new Fish(x, y, this, this, [immunities[0], immunities[1], immunities[2], immunities[3]], false));
                }
                familyArray.push(fishArray[chooseSelected]);
                fishArray.removeByValue(fishArray[chooseSelected]);
                selectedFish = familyArray[0];
                selectedFish.settings.selected = true;
                selectedFish.settings.gender = 1;
                selectedFish.settings.originalGenes = true;

                calcStats();
                countFrom = +new Date();
                playGame = true;

                if(firstControls){

                    // Display some information about controls.
                }
            } else{
                if(paused) pause();
            }
        };

        /**
         * Pause the game (toggles)
         */
        var pause = function(force){
            var now = +new Date();
            if(force){
                paused = true;
                pauseSplash.show();
            } else{
                paused = !paused;
                pauseSplash.toggle();
            }
            if(paused) pauseSet = +new Date;
            if(!paused){
                pauseTime += now - pauseSet;
            }
        };
        /**
         * End the game
         */
        var endGame = function(){
            playGame = false;
            gameOver = true;
            if(gameOver = true){
                backSound.stop();
                $('.numFish .result').text(hackRound(this.realFishCount));
                $('.numGenerations .result').text(hackRound(this.directGens));
                $('.numDirPopulation .result').text(hackRound(this.realDirPop));
                paramFolder.close();
                controlsFolder.close();
                updateOnlineScore();
            }
        };

        /**
         * Shows the help menu and pauses the game (toggles)
         */
        var help = function(){
            toggleHelp();
        };

        /**
         * Debug the game (toggles, doesn't remove FPS though)
         */
        var debugMode = function(){
            debug = !debug;

            if(!stats){
                stats = new Stats();
                stats.setMode(0); // 0: fps, 1: ms

                // Align top-left
                stats.domElement.style.position = 'absolute';
                stats.domElement.style.left = '0px';
                stats.domElement.style.top = '0px';

                document.body.appendChild(stats.domElement);

                setInterval(function(){
                    stats.update();
                }, 1000 / 60);
            }
        };

        /**
         * Enters full screen mode
         */
        var fullscreen = function(){
            if((document.fullScreenElement && document.fullScreenElement !== null) || // alternative standard method
                (!document.mozFullScreen && !document.webkitIsFullScreen)){               // current working methods
                if(document.documentElement.requestFullScreen){
                    document.documentElement.requestFullScreen();
                } else if(document.documentElement.mozRequestFullScreen){
                    document.documentElement.mozRequestFullScreen();
                } else if(document.documentElement.webkitRequestFullScreen){
                    document.documentElement.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
                }
            } else{
                if(document.cancelFullScreen){
                    document.cancelFullScreen();
                } else if(document.mozCancelFullScreen){
                    document.mozCancelFullScreen();
                } else if(document.webkitCancelFullScreen){
                    document.webkitCancelFullScreen();
                }
            }
        };

        var toggleHelp = function(){
            if(helpMenu.width() == 0){
                helpMenu.animate({
                    width:"400px"
                });
            } else{
                helpMenu.animate({
                    width:"0"
                });
            }
        };


        var selfBreed = function(){
            if(!familyArray[0].settings.baby) familyArray[0].breed(1, fishArray, env, familyArray[0]);
            else{
                smoke.alert('Too young to self.', {classname:" alert alert-info tooYoung"});
            }
        };

        var outCross = function(){
            if(!familyArray[0].settings.baby){
                familyArray[0].family.self = false;
                familyArray[0].family.decided = true;

            }
            else{
                smoke.alert('Too young too out cross.', {classname:" alert alert-info tooYoung"});
            }
        };

        return{
            numFish:numFish,
            numDeaths:numDeaths,
            numPathogens:numPathogens,
            directGens:directGens,
            directPop:directPop,
            dirDeaths:dirDeaths,
            realDirPop:realDirPop,
            numFood:numFood,
            populationScale:popScale,
            realFishCount:hackRound(realFishCount),
            gens:gens,
            temperature:temperature,
            chooseSelected:chooseSelected,
            selectedFish:selectedFish,
            calcStats:calcStats,
            indicator:indicator,
            maxFish:maxFish,
            birthCount:birthCount,
            giveUp:giveUp,
            naturalEndTime:naturalEndTime,
            lastEndTime:lastEndTime,
            lastStats:lastStats,
            lastInject:lastInject,
            play:play,
            pause:pause,
            gameOver:endGame,
            help:help,
            debug:debugMode,
            fullscreen:fullscreen,
            selfBreed:selfBreed,
            outCross:outCross
        }
    };

    /**
     * gender 1 :: Hermaphrodite
     * gender 2 :: Male
     *
     * @param x
     * @param y
     * @param parent1
     * @param parent2
     * @param immunities Array
     * @return {Object}
     * @constructor
     */
    Fish = function(x, y, parent1, parent2, immunities, direct){

        // Sprite settings
        var render = {
            height:22,
            width:80,
            stage:0,
            male:[
                {spriteX:0, spriteY:0, spriteH:41, spriteW:160},
                // center
                {spriteX:160, spriteY:0, spriteH:44, spriteW:160},
                // mid left
                {spriteX:160, spriteY:86, spriteH:44, spriteW:160},
                // left
                {spriteX:160, spriteY:0, spriteH:44, spriteW:160},
                // mid left
                {spriteX:0, spriteY:0, spriteH:41, spriteW:160},
                // center
                {spriteX:160, spriteY:44, spriteH:44, spriteW:160},
                // mid right
                {spriteX:160, spriteY:130, spriteH:44, spriteW:160},
                // right
                {spriteX:160, spriteY:44, spriteH:44, spriteW:160} // mid right
            ],
            herm:[
                {spriteX:0, spriteY:42, spriteH:44, spriteW:160},
                // center
                {spriteX:0, spriteY:86, spriteH:44, spriteW:160},
                // mid left
                {spriteX:0, spriteY:172, spriteH:44, spriteW:160},
                // left
                {spriteX:0, spriteY:86, spriteH:44, spriteW:160},
                // mid left
                {spriteX:0, spriteY:42, spriteH:44, spriteW:160},
                // center
                {spriteX:0, spriteY:130, spriteH:44, spriteW:160},
                // mid right
                {spriteX:0, spriteY:216, spriteH:44, spriteW:160},
                // right
                {spriteX:0, spriteY:130, spriteH:44, spriteW:160} // mid right
            ],
            pathoIcon:[
                {spriteX:223, spriteY:175, spriteH:3, spriteW:14},
                {spriteX:224, spriteY:182, spriteH:10, spriteW:11},
                {spriteX:224, spriteY:193, spriteH:7, spriteW:12},
                {spriteX:220, spriteY:201, spriteH:17, spriteW:20},
                {spriteX:224, spriteY:220, spriteH:7, spriteW:12}
            ],
            infectedIcon:{
                spriteX:220, spriteY:229, spriteH:16, spriteW:18
            }
        };

        var settings = {colour:"255,255,255", speed:4, gender:randomWithChance(85), baby:true, selected:false, health:100, originalGenes:direct, infected:0, infectedWith:[], lastInfCheck:0};
        var family = {parent1:parent1, parent2:parent2, birth:+new Date(), adultStart:false, breedStart:randomFromTo(10000, 30000), self:false, decided:false, expanded:false, targetMate:false, lastCheck:0};
        var pos = {x:x, y:y, targetX:x, targetY:y, targetReached:false, vx:0, vy:0, rotation:0, targetRotation:0};
        var immunity = [immunities[0], immunities[1], immunities[2], immunities[3]];

        /**
         * Draw the fish
         * @param ctx the canvas to be drawn on
         */
        var draw = function(ctx){
            var currentMatrix = getMidPoint(pos.x, pos.y, render.width, render.height, pos.rotation * Math.PI / 180);

            if(debug){
                ctx.beginPath();
                ctx.moveTo(currentMatrix.px, currentMatrix.py);
                ctx.lineTo(pos.targetX, pos.targetY);
                ctx.lineWidth = 1;
                ctx.stroke();
                ctx.closePath();
            }
            ctx.save();
            ctx.fillStyle = "rgba(52, 171, 105,1)";

            ctx.translate(currentMatrix.px, currentMatrix.py);
            ctx.rotate(pos.rotation * Math.PI / 180);
            ctx.translate(-currentMatrix.px, -currentMatrix.py);

            if(debug){
                ctx.fillRect(pos.x, pos.y + (render.height / 2), 200, 2);
            }

            if(!settings.baby){
                if(settings.gender == 1) sprite.draw(ctx, render.herm[render.stage].spriteX, render.herm[render.stage].spriteY, render.herm[render.stage].spriteW, render.herm[render.stage].spriteH, pos.x, pos.y, render.width, render.height);
                else sprite.draw(ctx, render.male[render.stage].spriteX, render.male[render.stage].spriteY, render.male[render.stage].spriteW, render.male[render.stage].spriteH, pos.x, pos.y, render.width, render.height);

                var barWidth = 40;
                var healthPercent = barWidth / 100 * settings.health;
                if(healthPercent > barWidth / 2) ctx.fillStyle = "#41b75f";
                else ctx.fillStyle = "#FB534C";
                ctx.fillRect(currentMatrix.px - barWidth / 2, currentMatrix.py - 22, healthPercent, 5);
                ctx.strokeStyle = "rgba(255,255,255,0.4)";
                ctx.lineWidth = 2;
                ctx.strokeRect(currentMatrix.px - barWidth / 2, currentMatrix.py - 22, barWidth, 5);
                if(settings.gender != 1 || settings.selected){
                    var increase = Math.PI * 2 / immunity.length;
                    var x = 0, y = 0, angle = 0;

                    for(var i = 0; i < immunity.length; i++){

                        var immu = immunity[i];

                        x = 50 * Math.cos(angle) + currentMatrix.px;
                        y = 50 * Math.sin(angle) + currentMatrix.py;
                        switch(immu){
                            case 1:
                                sprite.draw(ctx, render.pathoIcon[0].spriteX, render.pathoIcon[0].spriteY, render.pathoIcon[0].spriteW, render.pathoIcon[0].spriteH, x - (render.pathoIcon[0].spriteW / 2), y - (render.pathoIcon[0].spriteH / 2), render.pathoIcon[0].spriteW, render.pathoIcon[0].spriteH);
                                break;
                            case 2:
                                sprite.draw(ctx, render.pathoIcon[1].spriteX, render.pathoIcon[1].spriteY, render.pathoIcon[1].spriteW, render.pathoIcon[1].spriteH, x - (render.pathoIcon[1].spriteW / 2), y - (render.pathoIcon[1].spriteH / 2), render.pathoIcon[1].spriteW, render.pathoIcon[1].spriteH);
                                break;
                            case 3:
                                sprite.draw(ctx, render.pathoIcon[2].spriteX, render.pathoIcon[2].spriteY, render.pathoIcon[2].spriteW, render.pathoIcon[2].spriteH, x - (render.pathoIcon[2].spriteW / 2), y - (render.pathoIcon[2].spriteH / 2), render.pathoIcon[2].spriteW, render.pathoIcon[2].spriteH);
                                break;
                            case 4:
                                sprite.draw(ctx, render.pathoIcon[3].spriteX, render.pathoIcon[3].spriteY, render.pathoIcon[3].spriteW, render.pathoIcon[3].spriteH, x - (render.pathoIcon[3].spriteW / 2), y - (render.pathoIcon[3].spriteH / 2), render.pathoIcon[3].spriteW, render.pathoIcon[3].spriteH);
                                break;
                            case 5:
                                sprite.draw(ctx, render.pathoIcon[4].spriteX, render.pathoIcon[4].spriteY, render.pathoIcon[4].spriteW, render.pathoIcon[4].spriteH, x - (render.pathoIcon[4].spriteW / 2), y - (render.pathoIcon[4].spriteH / 2), render.pathoIcon[4].spriteW, render.pathoIcon[4].spriteH);
                                break;
                            default:
                            //ctx.fillText("Unknown " + settings.type, x, y);
                        }
                        angle += increase;
                    }
                }
                if(settings.infected && settings.selected){
                    sprite.draw(ctx, render.infectedIcon.spriteX, render.infectedIcon.spriteY, render.infectedIcon.spriteW, render.infectedIcon.spriteH, x - (render.infectedIcon.spriteW / 2), pos.y - 30, render.infectedIcon.spriteW, render.infectedIcon.spriteH);
                }

            } else{
                if(settings.gender == 1) sprite.draw(ctx, render.herm[render.stage].spriteX, render.herm[render.stage].spriteY, render.herm[render.stage].spriteW, render.herm[render.stage].spriteH, pos.x, pos.y, render.width / 2, render.height / 2);
                else sprite.draw(ctx, render.male[render.stage].spriteX, render.male[render.stage].spriteY, render.male[render.stage].spriteW, render.male[render.stage].spriteH, pos.x, pos.y, render.width / 2, render.height / 2);
                //ctx.fillText("Baby", pos.x + (render.width / 4), pos.y - 10);
            }

            if(settings.selected){
                if(env.indicator == 1){
                    ctx.fillStyle = "#CCC";
                    ctx.beginPath();
                    ctx.moveTo((pos.x + (render.width / 2)) - 10, pos.y - 24);
                    ctx.lineTo((pos.x + (render.width / 2)) + 10, pos.y - 24);
                    ctx.lineTo((pos.x + (render.width / 2)), pos.y - 14);
                    ctx.lineTo((pos.x + (render.width / 2)), pos.y - 14);
                    ctx.fill();
                    ctx.closePath();
                } else if(env.indicator == 0){
                    ctx.lineWidth = 2;
                    ctx.strokeStyle = "rgba(255,255,255, 0.4)";
                    ctx.beginPath();
                    ctx.arc(pos.x + (render.width / 2), pos.y + (render.height / 2), 44, 0, 2 * Math.PI, false);
                    ctx.stroke();
                    ctx.closePath();
                } else{
                }

            }

            if(!settings.baby && !family.self && family.decided){
                ctx.lineWidth = 2;
                ctx.strokeStyle = "rgba(255, 0, 128, 0.4)";
                ctx.beginPath();
                ctx.arc(pos.x + render.width - 10, pos.y + (render.height / 2), 5 * render.stage, 0, 2 * Math.PI, false);
                ctx.stroke();
                ctx.closePath();
            }

            render.stage++;
            if(render.stage >= 8) render.stage = 0;
            ctx.restore();

        };

        /**
         * Updates the fishes movement
         */
        var update = function(){
            var now = (+new Date()) - pauseTime;

            if(!settings.selected && pos.targetReached){
                pos.targetX = hackRound(Math.random() * canvasWidth - 40) + 20;
                pos.targetY = hackRound(Math.random() * canvasHeight - 40) + 20;
                pos.targetReached = false;
            }

            // Chooses family path
            if(!settings.selected && settings.gender == 1 && !family.decided){
                var choice = randomWithChance(70);
                if(choice == 1) family.self = true;
                family.decided = true;
            }
            var currentMatrix = getMidPoint(pos.x, pos.y, render.width, render.height, pos.rotation * Math.PI / 180);


            // Breed if time is right
            /**
             * IF
             * fish is not selected fish
             * is female
             * hasnt bred
             * isnt a baby
             * and is ready to breed
             */
            if(!settings.selected && settings.gender == 1 && !family.expanded && !settings.baby && now - family.adultStart >= family.breedStart || settings.selected && !family.self && family.decided){

                if(family.self == true){
                    breed(1, fishArray, env, this);
                } else{
                    if(now - family.adultStart >= env.giveUp){
                        family.self = true;
                    } else{
                        if(family.lastCheck == 0 || now - family.lastCheck >= (1000 / 20)){
                            for(var i = 0; i < fishArray.length; i++){
                                var dxTwo, dyTwo, distanceTwo;
                                var checkFish = fishArray[i];
                                if(checkFish != this){
                                    var checkMatrix = getMidPoint(checkFish.pos.x, checkFish.pos.y, render.width, render.height, checkFish.pos.rotation * Math.PI / 180);

                                    dxTwo = checkMatrix.px - currentMatrix.px;
                                    dyTwo = checkMatrix.py - currentMatrix.py;
                                    distanceTwo = Math.sqrt((dxTwo * dxTwo) + (dyTwo * dyTwo));

                                    if(distanceTwo < 50){
                                        if(checkFish.settings.gender != 1 && !checkFish.family.expanded && !checkFish.settings.baby && !checkFish.family.targetMate){
                                            family.targetMate = checkFish;
                                            checkFish.family.targetMate = this;
                                            if(settings.selected && firstBreed){
                                                smoke.alert('You have out crossed! This will boost your immunities and help your future generations fight off infections.', {classname:" alert alert-info"});
                                                firstBreed = false;
                                            }
                                            breed(2, fishArray, env, checkFish);
                                        }
                                    }
                                }
                            }
                            family.lastCheck = now;
                        }
                    }
                }

            }


            var dx = pos.targetX - currentMatrix.px + (render.width / 2);
            var dy = pos.targetY - currentMatrix.py + (render.height / 2);

            var distance = Math.sqrt((dx * dx) + (dy * dy));

            if(distance > render.width / 2){

                pos.vy = Math.sin(pos.rotation * Math.PI / 180) * settings.speed;
                pos.vx = Math.cos(pos.rotation * Math.PI / 180) * settings.speed;

                pos.x += pos.vx;
                pos.y += pos.vy;

                pos.targetRotation = Math.atan2(
                    dy,
                    dx
                ) * 180 / Math.PI;

                if(pos.targetRotation != pos.rotation){
                    // TODO: Remove debug text
                    var ax = Math.cos(pos.rotation * Math.PI / 180);
                    var ay = Math.sin(pos.rotation * Math.PI / 180);
                    var relativeDiffX = ax * dx + ay * dy;
                    var relativeDiffY = ax * dy - ay * dx;

                    var angle = Math.atan2(relativeDiffY, relativeDiffX);

                    //  context.fillText(pos.rotation, currentMatrix.px, currentMatrix.py+20);

                    var rotationAmount = 0;
                    //0.087 radians = 5 degrees
                    //0.17 = 10 degrees
                    var snap = 0.17;
                    if(angle > snap) rotationAmount = settings.speed * 2;
                    else if(angle < -snap) rotationAmount = -settings.speed * 2;

                    pos.rotation += rotationAmount;


                }
            } else{
                pos.targetReached = true;
            }


            if(settings.baby == true && now - family.birth >= 15000){
                settings.baby = false;
                family.adultStart = +new Date();
            }

            if(!settings.baby){
                if(settings.lastInfCheck == 0 || now - settings.lastInfCheck >= (1000 / 4)){
                    for(var i = 0; i < pathogenArray.length; i++){
                        var dxTwo, dyTwo, distanceTwo;
                        var checkPatho = pathogenArray[i];
                        dxTwo = checkPatho.pos.x - currentMatrix.px + (render.width / 2);
                        dyTwo = checkPatho.pos.y - currentMatrix.py + (render.height / 2);
                        distanceTwo = Math.sqrt((dxTwo * dxTwo) + (dyTwo * dyTwo));
                        var pathoType = checkPatho.settings.type;

                        var infected = false;
                        if(distanceTwo < 40 && immunity.indexOf(pathoType) == -1 && settings.infectedWith.indexOf(pathoType) == -1){
                            infected = true;
                            settings.infectedWith.push(pathoType);
                            settings.infected++;
                            checkPatho.remove(pathogenArray);
                            if(settings.selected && firstInfection){
                                smoke.alert('You have been infected. To avoid infection, out cross with males to pick up their immunities. Make sure you reproduce before you die.', {classname:" alert alert-info"});
                                firstInfection = false;
                            }
                        }
                    }
                    settings.lastInfCheck = now;
                }

                if(settings.infected){
                    settings.health -= (0.2 * settings.infected);
                    if(settings.health <= 0 && !settings.selected){
                        env.numFish--;
                        if(settings.originalGenes){
                            env.directPop--;
                        }
                        var arPos = fishArray.indexOf(this);
                        fishArray.removeByValue(fishArray[arPos]);
                        env.calcStats();
                        pathogenArray.push(new Pathogen(pos.x, pos.y, pathoType));

                    } else if(settings.health <= 0 && settings.selected){
                        env.gameOver();
                    }
                }
            }


            // Stop fish from swimming off screen
            if(pos.x + render.width > canvasWidth){
                pos.x = render.width / 2;
            }
            else if(pos.x + render.width <= 0){
                pos.x = canvasWidth - render.width + 2;
            }

            if(pos.y + render.height > canvasHeight){
                pos.y = render.height + 2;
            }
            else if(pos.y + render.height <= 0){
                pos.y = canvasHeight - render.height + 2;
            }

        };

        /**
         * Points the fish at a chosen target
         * @param x
         * @param y
         */
        var move = function(x, y){
            pos.targetX = x;
            pos.targetY = y;
        };

        /**
         * Breeds a fish
         * @param type 1: self, 2: out cross
         * @param array
         * @param env
         * @return {Object}
         */
        var breed = function(type, array, env, parent){
            var newFish;
            var numBabies = hackRound(randomFromTo(1, env.birthCount - 1));

            if(type == 1){

                for(var i = 0; i < numBabies; i++){
                    env.numFish++;
                    env.gens++;
                    if(settings.originalGenes){
                        env.directPop++;
                    }
                    newFish = array.unshift(new Fish(pos.x, pos.y - 40, this, this, [immunity[0], immunity[1], immunity[2], immunity[3]], settings.originalGenes));
                    if(array.length >= env.maxFish){
                        array.pop();
                    }
                    if(settings.infected){
                        pathogenArray.push(new Pathogen(pos.x, pos.y, settings.infectedWith.length -1));
                    }
                    env.calcStats();
                }
            } else{
                for(var b = 0; b < Math.floor(numBabies / 2); b++){
                    env.numFish++;
                    env.gens++;
                    if(settings.originalGenes){
                        env.directPop++;
                    }
                    var newImmu = [];
                    var i = 0;
                    while(i < immunity.length){

                        if(immunity[i] != 0 && parent.immunity.indexOf(immunity[i]) >= 0 && newImmu.indexOf(immunity[i]) == -1){ // Definitely have immunity
                            newImmu.unshift(immunity[i]);
                        } else if(parent.immunity[i] == 0 && immunity[i] != 0 || parent.immunity[i] != 0 && immunity[i] == 0){
                            if(parent.immunity[i] == 0) newImmu.unshift(immunity[i]); // Mum
                            else newImmu.unshift(parent.immunity[i]); // Dad
                        }
                        else{
                            var rndm = Math.random();
                            if(rndm > 0.5){
                                // Mum
                                newImmu.unshift(immunity[i]);
                            } else{
                                // Dad
                                newImmu.unshift(parent.immunity[i]);
                            }
                        }
                        i++;
                    }
                    newImmu.length = 4;

                    env.numFish++;
                    newFish = array.unshift(new Fish(pos.x, pos.y - 40, this, parent, newImmu, settings.originalGenes));
                    if(array.length >= env.maxFish){
                        array.pop();
                    }
                    env.calcStats();
                }
            }

            if(settings.selected){
                familyArray.unshift(array[0]);

                var fish = familyArray[0];


                if(parent != this){
                    array.removeByValue(parent);
                }

                fishArray.removeByValue(array[0]);

                settings.selected = false;
                fish.settings.selected = true;
                fish.settings.gender = 1;
                env.selectedFish = fish;
                env.directGens = familyArray.length;

            } else{
                remove(array, env);
                array.removeByValue(parent);
            }

            family.expanded = true;
        };

        /**
         * Removes fish from array
         * @param owner
         */
        var remove = function(array, env){
            var arPos = fishArray.indexOf(this);
            array.removeByValue(fishArray[arPos]);
            // TODO: Find possible way to make this less static
            env.numFish--;
            env.calcStats();
        };

        return{
            settings:settings,
            pos:pos,
            parents:[family.parent1, family.parent2],
            immunity:[immunity[0], immunity[1], immunity[2], immunity[3]],
            family:family,
            draw:draw,
            update:update,
            move:move,
            breed:breed,
            remove:remove
        }
    };

    /**
     * Pathogen Object
     * @param x
     * @param y
     * @param type
     * @return {Object}
     * @constructor
     */
    Pathogen = function(x, y, type){
        var render = {
            typeOne:[
                {spriteX:168, spriteY:174, spriteH:8, spriteW:34}
            ],
            typeTwo:[
                {spriteX:170, spriteY:191, spriteH:27, spriteW:27}
            ],
            typeThree:[
                {spriteX:171, spriteY:219, spriteH:19, spriteW:31}
            ],
            typeFour:[
                {spriteX:163, spriteY:240, spriteH:42, spriteW:48}
            ],
            typeFive:[
                {spriteX:169, spriteY:289, spriteH:15, spriteW:31}
            ]
        };

        if(!type){
            type = hackRound(randomFromTo(1, 4))
        }

        var settings = {type:type, size:hackRound(randomFromTo(2, 5)) / 10};
        var pos = {x:x, y:y, vx:0, vy:0, maxSpeed:0.1, rotation:hackRound(randomFromTo(1, 360))};

        var draw = function(ctx){
            ctx.save();
            var currentMatrix = getMidPoint(pos.x, pos.y, 50, 40, pos.rotation * Math.PI / 180);
            ctx.translate(currentMatrix.px, currentMatrix.py);
            ctx.rotate(pos.rotation * Math.PI / 180);
            ctx.translate(-currentMatrix.px, -currentMatrix.py);

            switch(settings.type){
                case 1:
                    sprite.draw(ctx, render.typeOne[0].spriteX, render.typeOne[0].spriteY, render.typeOne[0].spriteW, render.typeOne[0].spriteH, pos.x, pos.y, render.typeOne[0].spriteW * settings.size, render.typeOne[0].spriteH * settings.size);
                    break;
                case 2:
                    sprite.draw(ctx, render.typeTwo[0].spriteX, render.typeTwo[0].spriteY, render.typeTwo[0].spriteW, render.typeTwo[0].spriteH, pos.x, pos.y, render.typeTwo[0].spriteW * settings.size, render.typeTwo[0].spriteH * settings.size);
                    break;
                case 3:
                    sprite.draw(ctx, render.typeThree[0].spriteX, render.typeThree[0].spriteY, render.typeThree[0].spriteW, render.typeThree[0].spriteH, pos.x, pos.y, render.typeThree[0].spriteW * settings.size, render.typeThree[0].spriteH * settings.size);
                    break;
                case 4:
                    sprite.draw(ctx, render.typeFour[0].spriteX, render.typeFour[0].spriteY, render.typeFour[0].spriteW, render.typeFour[0].spriteH, pos.x, pos.y, render.typeFour[0].spriteW * settings.size, render.typeFour[0].spriteH * settings.size);
                    break;
                case 5:
                    sprite.draw(ctx, render.typeFive[0].spriteX, render.typeFive[0].spriteY, render.typeFive[0].spriteW, render.typeFive[0].spriteH, pos.x, pos.y, render.typeFive[0].spriteW * settings.size, render.typeFive[0].spriteH * settings.size);
                    break;
                default:
                    ctx.fillText("Unknown " + settings.type, pos.x, pos.y - 10);
            }

            ctx.restore();
        };

        var update = function(){

            if(pos.vx < pos.maxSpeed){
                pos.vx += randomFromTo(-1, 1);
            }
            else{
                pos.vx -= randomFromTo(-1, 1);
            }

            if(pos.vy < pos.maxSpeed){
                pos.vy += randomFromTo(-1, 1);
            }
            else{
                pos.vy -= randomFromTo(-1, 1);
            }


            pos.x += pos.vx;
            pos.y += pos.vy;

            if(pos.x > canvasWidth){
                pos.x = 0;
            }
            else if(pos.x <= 0){
                pos.x = canvasWidth
            }

            if(pos.y > canvasHeight){
                pos.y = 0;
            }
            else if(pos.y <= 0){
                pos.y = canvasHeight
            }
        };

        var remove = function(array){
            var arPos = array.indexOf(this);
            array.removeByValue(array[arPos]);
        };

        return{
            draw:draw,
            render:render,
            pos:pos,
            settings:settings,
            update:update,
            remove:remove
        };
    };

    Food = function(x, y){
        var settings = {colour:"52, 171, 105", size:2};
        var pos = {x:x, y:y, vx:0, vy:0, maxSpeed:0.1};

        var draw = function(ctx){
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, settings.size, 0, 2 * Math.PI, false);
            ctx.fillStyle = "rgba(" + settings.colour + ",1)";
            ctx.fill();
            ctx.lineWidth = 5;
            ctx.strokeStyle = "rgba(" + settings.colour + ",0.4)";
            ctx.stroke();
            ctx.closePath();
        };

        var update = function(){

            if(pos.vx < pos.maxSpeed){
                pos.vx += randomFromTo(-1, 1);
            }
            else{
                pos.vx -= randomFromTo(-1, 1);
            }

            if(pos.vy < pos.maxSpeed){
                pos.vy += randomFromTo(-1, 1);
            }
            else{
                pos.vy -= randomFromTo(-1, 1);
            }


            pos.x += pos.vx;
            pos.y += pos.vy;

            if(pos.x > canvasWidth){
                pos.x = 0;
            }
            else if(pos.x <= 0){
                pos.x = canvasWidth
            }

            if(pos.y > canvasHeight){
                pos.y = 0;
            }
            else if(pos.y <= 0){
                pos.y = canvasHeight
            }
        };

        var remove = function(owner){
            owner.removeByValue(this);
            env.numFood--;
        };

        return{
            draw:draw,
            update:update,
            eat:remove
        };
    };

    /**
     * Mouse object
     * @param x
     * @param y
     * @return {Object}
     * @constructor
     */
    Mouse = function(x, y){
        var settings = {colour:"255,255,255", maxLife:20, life:0};
        var pos = {x:x, y:y};

        var draw = function(ctx){

            if(settings.life < settings.maxLife){
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, settings.life, 0, 2 * Math.PI, false);
                ctx.lineWidth = 4;
                ctx.strokeStyle = "rgba(" + settings.colour + ",0.4)";
                ctx.stroke();
                ctx.closePath();
                if(settings.life > settings.maxLife / 2){
                    ctx.beginPath();
                    ctx.arc(pos.x, pos.y, settings.life / 2, 0, 2 * Math.PI, false);
                    ctx.lineWidth = 2;
                    ctx.strokeStyle = "rgba(" + settings.colour + ",0.2)";
                    ctx.stroke();
                    ctx.closePath();
                }
                settings.life++;
            }
        };
        var update = function(){
            pos.x = mouseX;
            pos.y = mouseY;
            settings.life = 0;
        };

        return{
            draw:draw,
            update:update
        }
    };

    /**
     * Load in images / sprites
     * @param src File source of image
     * @return {Object}
     * @constructor
     */
    Sprites = function(src){
        var sprite = [new Image(), false];

        sprite[0].src = src;
        sprite[0].onload = function(){
            sprite[1] = true;
        };

        var draw = function(ctx, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight){
            if(sprite[1]){
                ctx.drawImage(sprite[0], sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
                if(debug){
                    ctx.beginPath();
                    ctx.lineWidth = 1;
                    ctx.strokeStyle = "#ffffff";
                    ctx.strokeRect(dx, dy, dWidth, dHeight);
                    ctx.closePath();
                }
            }
        };

        return {
            draw:draw
        };
    };

    /**
     * Sound object
     * @param src
     * @param title
     * @return {Object}
     * @constructor
     */
    Sound = function(src, title){
        var src = src;
        var elem;

        var create = function(){
            elem = $('<audio>', {
                loop:'loop'
            });
            elem.attr("id", title);
            addSource(elem.get(0), src[0]);
            addSource(elem.get(0), src[1]);
            addSource(elem.get(0), src[2]);
            $('body').append(elem.get(0));
        };


        var addSource = function(elem, src){
            $('<source>').attr('src', src).appendTo(elem);
        };

        var play = function(){
            elem.get(0).play();
        };

        var stop = function(){
            //elem.get(0).stop();
        };

        var volume = function(vol){
            elem.get(0).volume = vol;
        };

        return{
            src:src,
            create:create,
            addSource:addSource,
            volume:volume,
            play:play,
            stop:stop
        }
    };

    /**
     * FUNCTIONS
     */

    var sprite = new Sprites("img/sprites.svg");
    var statsGraph = new StatsGraph();
    var env = new Environment;
    var backAudio = ['assets/Arcadia.wav', 'assets/Arcadia.mp3', 'assets/Arcadia.ogg'];
    var backSound = new Sound(backAudio, "bg");
    backSound.create();
    backSound.volume(0.05);
    mouseAnim = new Mouse(mouseX, mouseY);
    checkWindowSize(env);

    /**
     * Render the game frame
     */
    function render(){

        context.clearRect(0, 0, canvasWidth, canvasHeight);
        while(pathogenArray.length < env.numPathogens){
            var x = hackRound(Math.random() * canvasWidth);
            var y = hackRound(Math.random() * canvasHeight);
            pathogenArray.push(new Pathogen(x, y));
        }
        for(var i = 0; i < pathogenArray.length; i++){
            var patho = pathogenArray[i];
            patho.draw(context);
            patho.update();
        }
        for(var i = 0; i < fishArray.length; i++){
            var fish = fishArray[i];
            fish.draw(context);
            fish.update();
        }
        familyArray[0].draw(context);
        familyArray[0].update();

        // Update fish numbers
        var now = (+new Date()) - pauseTime;
        if(now - env.lastEndTime >= env.naturalEndTime){
            env.numDeaths = hackRound((env.numFish - env.numDeaths) / 100 * 20);
            while(env.realFishCount < (fishArray.length + 1)){
                fishArray.pop();
            }
            env.calcStats();
            env.lastEndTime = now;
        }

        // Insert fish with full immunities ever 2 mins / 120000.
        if(env.gens >= 50){
            env.numFish++;
            var x = hackRound(Math.random() * canvasWidth);
            var y = hackRound(Math.random() * canvasHeight);
            var immunity = hackRound(randomFromTo(1, 5));
            fishArray.unshift(new Fish(x, y, this, this, [immunity, immunity, immunity, immunity], false));
            if(fishArray.length >= env.maxFish){
                fishArray.pop();
            }
            env.calcStats();

            //env.lastInject = now;
            env.gens = 0;
        }

        if(mousePressed){
            // TODO This needs to be non static
            familyArray[0].move(mouseX, mouseY);
        }
        // Update Graph
        if(now - env.lastStats >= 1000){
            statsGraph.addData(hackRound(env.realFishCount));
            statsGraph.addDirData(hackRound(env.realDirPop));
            env.lastStats = now;
        }
        statsGraph.draw(context);
        mouseAnim.draw(context);
    }

    /**
     * Sets the text on the game
     */
    function setText(){
        $("#browser_support").html(language.returnString("best_browser"));
        $(".welcome_text_body").html(language.returnString("welcome_text_body"));
        $(".help_selected_baby").text(language.returnString("help_selected_baby"));
        $(".help_selected_adult").text(language.returnString("help_selected_adult"));
        $(".help_click").text(language.returnString("help_click"));
        $(".help_controls").text(language.returnString("help_controls"));
        $(".help_stats").text(language.returnString("help_stats"));
        $(".help_male_fish").text(language.returnString("help_male_fish"));
        $(".help_infected_fish").text(language.returnString("help_infected_fish"));
        $(".playAgain").text(language.returnString("play"));
        $(".help").text(language.returnString("help"));
        $(".objective").text(language.returnString("objective"));
        $(".objective_text").text(language.returnString("objective_text"));
        $(".controls_title").text(language.returnString("controls"));
        $(".movement").text(language.returnString("movement"));
        $(".movement_text").text(language.returnString("movement_text"));
        $(".breeding").text(language.returnString("breeding"));
        $(".breeding_text").text(language.returnString("breeding_text"));
        $(".faq").text(language.returnString("faq"));
        $(".where_parents").text(language.returnString("where_parents"));
        $(".where_parents_text").text(language.returnString("where_parents_text"));
        $(".running_slow").text(language.returnString("running_slow"));
        $(".running_slow_text").text(language.returnString("running_slow_text"));
        $(".population_down").text(language.returnString("population_down"));
        $(".population_down_text").text(language.returnString("population_down_text"));
        $(".credits").text(language.returnString("credits"));
        $(".music").text(language.returnString("music"));
        $(".not_supported").text(language.returnString("not_supported"));
        $(".paused_game").text(language.returnString("paused_game"));
        $(".game_over").text(language.returnString("game_over"));
        $(".total_fish").text(language.returnString("total_fish"));
        $(".total_generations").text(language.returnString("total_generations"));
        $(".total_direct").text(language.returnString("total_direct"));
        $(".highscores_text").text(language.returnString("highscores"));
    }
    /**
     * Updates screen variables when size changes
     */
    function resizeWindow(){
        canvasWidth = $(window).get(0).innerWidth;
        canvasHeight = $(window).get(0).innerHeight;
        canvas.attr("width", canvasWidth);
        canvas.attr("height", canvasHeight);
    }

    /**
     * Checks the window frame and adjusts game settings
     * @param env
     */
    function checkWindowSize(env){
        var width = $(window).get(0).innerWidth;
        var height = $(window).get(0).innerHeight;

        if(width <= 1024 && height <= 768){
            env.maxFish = 25;
            env.numFood = 10;
        }

        if(width <= 960 && height <= 640){
            env.maxFish = 15;
            env.numFood = 0;
        }
    }

    /**
     * Pushes the users high score to the database and refreshes high scores table.
     */
    function updateOnlineScore(){
        var score = Math.round((env.realDirPop / env.realFishCount * 100)*100)/100;
        $.ajax({
            type:"POST",
            cache:false,
            data:"score=" + score + "&player=" + username,
            url:"php/ajax/submitScore.php",
            success:function(html){
                $(".highscores ul").html(html);
            }

        });
    }

    /**
     * Generate a random number between 2 numbers.
     * @param from
     * @param to
     */
    function randomFromTo(from, to){
        return Math.random() * (to - from + 1) + from;
    }

    /**
     * Faster way or rounding a number
     * @param num
     * @return {Number}
     */
    function hackRound(num){
        return num << 0;
    }

    /**
     * Randomly choose true or false
     * @return {String}
     */
    function randomBoolean(){
        var rndm = hackRound(Math.random());
        return rndm == 1 ? "true" : "false";
    }

    function mouseUp(e){
        mousePressed = false;
        mouseXY(e);
    }

    function touchUp(){
        mousePressed = false;
    }

    function mouseDown(e){
        mousePressed = true;
        mouseXY(e);
        mouseAnim.update();
    }

    function touchDown(){
        mousePressed = 1;
        touchXY();
        mouseAnim.update();

    }

    function mouseXY(e){
        if(!e) var e = event || window.event;
        mouseX = e.pageX - canvas.get(0).offsetLeft;
        mouseY = e.pageY - canvas.get(0).offsetTop;


        // Disable right click
        if(e.button == 2 || e.button == 3){
            return false;
        }
        document.oncontextmenu = new Function("return false");

    }

    function touchXY(e){
        if(!e) var e = event;
        e.preventDefault();
        if(event.targetTouches.length == 1){
            mouseX = e.targetTouches[0].pageX - canvas.get(0).offsetLeft;
            mouseY = e.targetTouches[0].pageY - canvas.get(0).offsetTop;
        }
    }

    /**
     * Returns the mid point of
     * @param x
     * @param y
     * @param width
     * @param height
     * @param angle_degrees
     * @return {Object}
     */
    function getMidPoint(x, y, width, height, angle_degrees){
        var angle_rad = angle_degrees * Math.PI / 180;
        var cosa = Math.cos(angle_rad);
        var sina = Math.sin(angle_rad);
        var wp = width / 2;
        var hp = height / 2;
        return { px:( x + wp * cosa - hp * sina ),
            py:( y + wp * sina + hp * cosa ) };
    }

    /**
     * Returns 1 if within the highest chance
     * @param num Highest chance 75%
     * @return {Number}
     */
    function randomWithChance(num){
        var random = hackRound(Math.random() * 100);

        if(random < num){
            return 1;
        } else{
            return 0;
        }
    }

    /**
     * This is called when the game is not in focus.
     */
    function outOfFocus(){
        if(playGame) env.pause(true);
    }

    /**
     * Resets game
     */
    $(".playAgain").on("click", reset);

    $(".startUpData").on("click", function(){
        var name = $('#yourName').val();
        var age = $('#yourAge').val();
        var gender = $('#yourGender').val();

            $.ajax({
                type:"POST",
                cache:false,
                data:"name=" + name + "&age=" + age + "&gender="+ gender,
                url:"php/ajax/submitData.php",
                success:function(html){
                    //console.log("starting....")
                }

            });
    });

    function reset(){
        username = $('.nameForm input').val();
        if(gameOver){
            username = $('.nameFormEnd input').val()
        }
        if(username == ""){
            alert("You need to enter a name");
            return false;
        }
        fishArray = [];
        familyArray = [];
        pathogenArray = [];
        env.numFish = 10;
        env.numDeaths = 0;
        env.directGens = 1;
        env.directPop = 1;
        env.popScale = 1;
        env.calcStats();
        env.play();
        paramFolder.open();
        controlsFolder.open();
        pauseTime = 0;
        statsGraph.reset();
    }

    /**
     * Starts the game loop
     */
    function startGame(){
        requestAnimationFrame(startGame);
        var delta = +new Date() - lastUpdateTime;
        if(acDelta > msPerFrame){
            acDelta = 0;
            if(playGame){
                if(paused){

                } else{
                    render();
                    if((+new Date()) - pauseTime - countFrom >= countingTo){
                        env.gameOver();
                    }
                }
            } else if(gameOver){
                endSplash.show();
            } else{
                // Show ui
            }
        } else{
            acDelta += delta;
        }

        lastUpdateTime = +new Date();
    }

    /**
     *
     * INITIATE LISTENERS AND GUI
     *
     */
    canvas.get(0).addEventListener("mousedown", mouseDown, false);
    canvas.get(0).addEventListener("mousemove", mouseXY, false);
    canvas.get(0).addEventListener("touchstart", touchDown, false);
    canvas.get(0).addEventListener("touchmove", touchXY, true);

    canvas.get(0).addEventListener("mouseup", mouseUp, false);
    canvas.get(0).addEventListener("touchcancel", touchUp, false);
    window.addEventListener("resize", resizeWindow);

    window.onblur = outOfFocus;

    // Disable selection
    document.onselectstart = function(){
        return false;
    };

    // idleTimer() takes an optional argument that defines the idle timeout
// timeout is in milliseconds; defaults to 30000
    $.idleTimer(300000);
    $(document).bind("idle.idleTimer", function(){
        window.location = window.location.href;
    });

    $(".show_tutorial").on("click", function(){
        $(".welcome_text").hide();
        $(".tutorial").show();
    });

    $(".get_started").on("click", function(){
        $(".welcome_text").hide();
        $(".tutorial").hide();
        $(".nameForm").show();
    });

    var gui = new dat.GUI();

    var paramFolder = gui.addFolder('Variables');
    paramFolder.add(env, 'realFishCount').name('All Fish').listen();
    paramFolder.add(env, 'directGens').name('Generations').listen();
    paramFolder.add(env, 'realDirPop').name('Your Fish').listen();
    //paramFolder.add(env, 'numPathogens').name('Pathogens #').listen();

    var controlsFolder = gui.addFolder('Game Controls');
    controlsFolder.add(env, 'selfBreed').name('Self Breed');
    controlsFolder.add(env, 'outCross').name('Out Cross');

    var settingsFolder = gui.addFolder('Game Settings');
    settingsFolder.add(env, 'pause').name('Pause Game');
    settingsFolder.add(env, 'gameOver').name('End Game');
    settingsFolder.add(env, 'help').name('Help');
    settingsFolder.add(env, 'fullscreen').name('Fullscreen Toggle');
    settingsFolder.open();

    var graphicsFolder = gui.addFolder('Graphics Settings');
    graphicsFolder.add(env, 'indicator', {Halo:0, Arrow:1, None:2}).name('Fish Indicator');
    graphicsFolder.add(env, 'maxFish', {Low:15, Medium:25, High:50}).name('Number of Fish Visible');
    //graphicsFolder.add(env, 'numFood', {None:0, Low:10, Medium:20, High:40}).name('Number of Food Particles');
    //graphicsFolder.add(env, 'debug');

    startGame();

});