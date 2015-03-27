(function(){

    MAX_WAVE = 10;
    MAX_LEVEL = 7;
    WIDTH = 800;
    HEIGHT = 450;
    
    SCORE_INCREMENT = 100;
    JUMP_PRESS_MAX = 2;
    JUMP_VELOCITY = -220;

    LASER_DAMAGE = 1;
    MAX_LASERS = 1;

    ENEMY_HIT_ANIMATION_MS = 90;
    ENEMY_HIT_ANIMATION_INTERVALS = 7;
    ENEMY_DAMAGE_TINT = 0x990000;

    PLAYER_START_X = 35;
    PLAYER_SPEED = 2;
    LASER_FIRE_TIMEOUT = 500;

    var currentLevel = 1;
    var currentWave = 1;
    var currentScore = 0;
    var jumpPressed = 0;
    var muted = false;
    var showHightscore = false;
    var volume = 0.3;

    var game = new Phaser.Game(WIDTH, HEIGHT, Phaser.AUTO, 'game', { preload: preload, create: create, update: update });

    var background;

    var platforms;

    var enemies;

    var backgroundObjects;

    var player;

    var foregroundObjects;

    var lasers;

    var lasersToDestroy = [];

    var canFireLaser = true;

    var sounds = {};

    var platformData = [
        // top
        {x: 45, y: 120, sprite: 'platform_small'},
        //{x: 200, y: 135, sprite: 'platform_small'},
        {x: 355, y: 115, sprite: 'platform_small'},
        //{x: 496, y: 125, sprite: 'platform_small'},
        {x: 657, y: 110, sprite: 'platform_small'},

        // middle
        {x: 60, y: 245, sprite: 'platform_medium'},
        {x: 290, y: 280, sprite: 'platform_small'},
        {x: 410, y: 280, sprite: 'platform_small'},
        {x: 550, y: 245, sprite: 'platform_medium'},

        {x: 60, y: 345, sprite: 'platform_small'},
        {x: 650, y: 345, sprite: 'platform_small'},
    ];

    var backgroundObjects = [
        {x: 30, y: 350, sprite: 'lampost'},
        {x: 380, y: 350, sprite: 'lampost'},
        {x: 730, y: 350, sprite: 'lampost'},
    ];

    var foregroundObjects = [
        {x: 50, y: 405, sprite: 'rubbish_bin'},
        {x: 400, y: 405, sprite: 'rubbish_bin'},
        {x: 750, y: 405, sprite: 'rubbish_bin'},
    ];

    var inputStates = {
        39: function(){ movePlayerForward(PLAYER_SPEED) },
        37: function(){ movePlayerBackward(PLAYER_SPEED) },
        //38: function(){ playerJump() },
    };

    function preload()
    {
       game.load.image('background', 'assets/img/background_two.jpg', 0, 0);
       game.load.image('floor', 'assets/img/floor.png', 0, 0);
       game.load.image('platform_large', 'assets/img/platform_large.png', 0, 0);
       game.load.image('platform_medium', 'assets/img/platform_medium.png', 0, 0);
       game.load.image('platform_small', 'assets/img/platform_small.png', 0, 0);
       game.load.image('rubbish_bin', 'assets/img/rubbish_bin.png', 0, 0);
       game.load.image('lampost', 'assets/img/lampost.png', 0, 0);

       game.load.spritesheet('player_spritemap', 'assets/img/player_spritemap.png', 22, 35);
       game.load.spritesheet('enemy_spritemap', 'assets/img/enemy_spritemap.png', 22, 35);
       game.load.spritesheet('laser_spritemap', 'assets/img/laser_spritemap.png', 23, 11);

       game.load.audio('blast', ['assets/audio/blast.wav']);
       game.load.audio('jump', ['assets/audio/jump.wav']);
       game.load.audio('explosion', ['assets/audio/explosion.wav']);
       game.load.audio('theme', ['assets/audio/theme_two_cut.mp3']);
       game.load.audio('death', ['assets/audio/death_three.wav']);
       game.load.audio('level_up', ['assets/audio/level_up.wav']);
       // http://www.bfxr.net/

    }

    function create()
    {
        setCanvasSize();

        game.paused = true;
        game.over = false;

        setTimeout(function(){
            document.getElementById('logo-container').remove()
            game.paused = false;
        }, 3000);

        game.physics.startSystem(Phaser.Physics.ARCADE);

        sounds['blast'] = game.add.audio('blast', volume);
        sounds['jump'] = game.add.audio('jump', volume);
        sounds['explosion'] = game.add.audio('explosion', volume);
        sounds['theme'] = game.add.audio('theme', volume);
        sounds['death'] = game.add.audio('death', volume);
        sounds['level_up'] = game.add.audio('level_up', volume);

        playSound('theme', true);
        resartThemeMusicIfEnded();

    
        background = createBackground();
        platforms = createPlatforms();
        backgroundObjects = createGroupWithObjects(backgroundObjects);
        //new Player(game);
        player = createPlayer();
        foregroundObjects = createGroupWithObjects(foregroundObjects);
        lasers = createLasers();

        enemies = game.add.group();
        enemies.enableBody = true;
        enemies.physicsBodyType = Phaser.Physics.ARCADE;
        createEnemies(1)

        addEventListeners()

        game.input.keyboard.onDownCallback = function()
        {
            // add jump timeout fix weird double jump problem
            if (! game.over)
            {
                lastKeyCode = game.input.keyboard.lastKey.keyCode;

                if (lastKeyCode === 38)
                {
                    playerJump();
                }

                if (lastKeyCode === 32)
                {
                    fireLaser();
                }
            }
                
        }

        game.input.keyboard.onUpCallback = function()
        {
            setStandingAnimation(player);
        }

        renderGameInfo();
    }

    function update()
    {
        /*if (allChildrenAreDead(enemies))
        {
            incrementWavesAndLevels();
        }*/

        moveEnemies();
        moveLasers();
        laserHasHitEnemy();
        checkIfEnemyHasHitPlayer();
        game.physics.arcade.collide(platforms, player);

        game.physics.arcade.collide(platforms, enemies);

        checkInput();

        if (player.body.touching.down)
        {
            resetJumpPressed()
        }

        destroyLasers()
    }

    function destroyLasers()
    {
        for(i = 0; i < lasersToDestroy.length; i++){
            lasersToDestroy[i].destroy()
        }
    }

    /***
    * Sets the canvas size to fullscreen size of the windows up to a max
    * of the variable WIDTH and HEIGHT
    ***/

    function setCanvasSize()
    {

    }

    /***
    * Creates background sprite
    ***/

    function createBackground()
    {
        background = game.add.sprite(0, 0, 'background');
        background.height = HEIGHT;
        background.width = WIDTH;

        return background;
    }

    /***
    * Creates objects in a group
    ***/

    function createGroupWithObjects(objects)
    {
        group = game.add.group();
        group.enableBody = true;

        for (i = 0; i < objects.length; i++)
        {
            bg = objects[i];
            lampost = group.create(bg.x, bg.y, bg.sprite);
            lampost.body.immovable = true;
        }

        return group;
    }

    function createPlatforms()
    {
        platforms = game.add.group();
        platforms.enableBody = true;

        floorPlatform = platforms.create(0, 0, 'floor');
        floorPlatform.y = HEIGHT - floorPlatform.height
        floorPlatform.width = WIDTH;
        floorPlatform.body.immovable = true;

        for(i = 0; i < platformData.length; i++)
        {
            p = platformData[i];
            p = platforms.create(p.x, p.y, p.sprite);
            p.body.immovable = true;
        }

        return platforms;
    }

    function createPlayer()
    {
        
        player = game.add.sprite(0, 0, 'player_spritemap');
        game.physics.arcade.enable(player);
        player.body.bounce.y = 0.2;
        player.body.gravity.y = 300;
        player.body.collideWorldBounds = true; 

        player.body.setSize(22, 35, 0, 0);
        player.animations.add('standing_left', [12, 13, 14, 15], 8, true);
        player.animations.add('standing_right', [0, 1, 2, 3], 8, true);
        player.animations.add('walking_right', [4, 5, 6, 7], 8, true);
        player.animations.add('walking_left', [8, 9, 10, 11], 8, true);

        setPlayerX();
        return player;
    }

    /***
    * Sets a random X for player and sets direction
    * For now this is hardcoded.
    ***/

    function setPlayerX()
    {
        playerX = getRandomVal(100, (WIDTH - 200))
        playerX = PLAYER_START_X;
        player.x = playerX;

        if (playerX > WIDTH/2)
        {
            player.direction = -1;
        }
        else 
        {
            player.direction = 1;
        }
        setStandingAnimation(player);
    }

    /***
    * Creates all the enemies needed for a particular wave
    * @return void
    ***/

    function createEnemies(amount)
    {
        for (i = 0; i < amount; i++)
        {
            enemy = enemies.create(getRandomVal(70, WIDTH), 0, 'enemy_spritemap')
            //enemy.anchor.setTo(.5, 1);
            enemy.body.bounce.y = 0.2;
            enemy.body.gravity.y = 300;
            enemy.body.collideWorldBounds = true; 
            enemy.direction = chooseValueAtRandom(-1, 1);
            enemy.speed = getRandomFloat(0.9, 1.2);
            enemy.speed = 1
            enemy.lastY = Math.round(enemy.body.y)

            enemy.body.setSize(22, 35, 0, 0);
            enemy.animations.add('standing_left', [12, 13, 14, 15], 8, true);
            enemy.animations.add('standing_right', [0, 1, 2, 3], 8, true);
            enemy.animations.add('walking_right', [4, 5, 6, 7], 8, true);
            enemy.animations.add('walking_left', [8, 9, 10, 11], 8, true);

            setDirectionAnimation(enemy);
        }

        // make sure our laser and foreground objects are in front of the enemies
        game.world.bringToTop(lasers);
        game.world.bringToTop(foregroundObjects);
        
    }

    function createLasers()
    {
        lasers = game.add.group();
        lasers.enableBody = true;
        lasers.physicsBodyType = Phaser.Physics.ARCADE;
        return lasers;
    }

    /***
    * Checks the key down inputs and pushes into input states array
    ***/

    function checkInput()
    {
        if ( ! game.over)
        {
            for (i = 0; i < game.input.keyboard._keys.length; i++)
            {
                keyCode = getKeyCodeFromKey(game.input.keyboard._keys[i])
                if (inputStates.hasOwnProperty(keyCode))
                    return inputStates[keyCode]();
            }
        }
        
    }

    /***
    * Gets the keycode from a key object
    ***/

    function getKeyCodeFromKey(key)
    {
        if (key != undefined && key.hasOwnProperty('keyCode') && key.isDown)
            return key.keyCode
    }

    /***
    * Sets direction of player based on speed provided and 
    * sets the direction of the player sprite
    ***/

    function movePlayerForward(speed)
    {
        player.x += speed;
        player.direction = 1;
        setDirectionAnimation(player)
    }

    /***
    * Sets direction of player based on speed provided and 
    * sets the direction of the player sprite
    ***/

    function movePlayerBackward(speed)
    {
        player.x -= speed;
        player.direction = -1;
        setDirectionAnimation(player)
    }

    /***
    * Allows player to jump and plays jump sound
    * Player can jump intull jumpPressed has reached
    * JUMP_PRESS_MAX
    ***/

    function playerJump()
    {
        // can only jump twice until landed
        // if jump pressed is less than two then jump else do nothing
        // reset on collision with platform or floor
        if (jumpPressed < JUMP_PRESS_MAX)
        {
            jumpPressed++;
            playSound('jump');
            player.body.velocity.y = JUMP_VELOCITY;
        }
    }

    function setStandingAnimation(sprite)
    {
        if (sprite.direction === 1)
        {
            sprite.animations.play('standing_right');
        }
        else 
        {
            sprite.animations.play('standing_left');
        }
    }

    function setDirectionAnimation(sprite)
    {
        if (sprite.direction === 1)
        {
            sprite.animations.play('walking_right');
        }
        else 
        {
            sprite.animations.play('walking_left');
        }
    }

    /***
    * Determines what the next wave and level should be
    * @return void
    ***/

    function incrementWavesAndLevels()
    {
        if (hasNoChildren(enemies))
        {
            currentLevel++;
            if (currentLevel > MAX_LEVEL)
            {
                currentWave++;
                currentLevel = 1;
                playSound('level_up');
            }

            createEnemies(currentLevel);
        }

        renderGameInfo()
    }

    function renderGameInfo()
    {
        document.getElementById('score').innerHTML = currentScore;
        document.getElementById('level').innerHTML = currentLevel+"/"+MAX_LEVEL;
        document.getElementById('wave').innerHTML = currentWave;
    }

    /***
    * Detects if all the current enemies are dead
    * @return bool
    ***/

    function allChildrenAreDead(parent)
    {
        for (i = 0; i < parent.children.length; i++)
        {
            if (parent.children[i].alive == 0)
                return true;
        }

        return false;
    }

    function hasChildren(parent)
    {
        return parent.children.length != 0;
    }

    function hasNoChildren(parent)
    {
        return parent.children.length == 0;
    }

    function getRandomVal(min, max)
    {
        if (min == undefined)
            min = 0;

        return Math.floor((Math.random() * max) + min);
    }

    function getRandomFloat(min, max)
    {
        return (Math.random() * max) + min;
    }

    function chooseValueAtRandom(valueOne, valueTwo)
    {
        return Math.random() < 0.5 ? valueOne : valueTwo;
    }

    function fireLaser()
    {
        // check how many lasers are alive currently, if less than max amount then create
        if (canFireLaser)
        {
            canFireLaser = false;

            setTimeout(function(){
                canFireLaser = true;
            }, LASER_FIRE_TIMEOUT);


            laser = lasers.create(0, 0, 'laser_spritemap');
            laser.body.setSize(11, 23, 0, 0);
            laser.animations.add('fire_right', [0, 1, 2, 3, 4, 5], 6, true);
            laser.animations.add('fire_left', [6, 7, 8, 9, 10, 11], 6, true);

            laser.checkWorldBounds = true;
            laser.events.onOutOfBounds.add(function(laser)
            { 
                addLaserToBeDestroyed(laser);
            }, this );

            setLaserDirection(laser);
            setLaserPosition(laser);
            setLaserAnimation(laser)
        }

        
    }

    function setLaserPosition(laser)
    {
        // base on direction, do we place front of back of sprite
        if (player.direction == 1)
        {
            laser.x = player.body.x + 20;
        }
        else {
            laser.x = player.body.x - 20;
        }
        laser.y = player.body.y + 10;
    }

    function setLaserDirection(laser)
    {
        laser.direction = player.direction;
    }

    function setLaserAnimation(laser)
    {
        if (laser.direction == 1)
        {
            laser.animations.play('fire_right');
        } 
        else 
        {
            laser.animations.play('fire_left');
        }
    }

    function moveLasers()
    {
        for(i = 0; i < lasers.children.length; i++)
        {
            laser = lasers.children[i];
            if (laser.direction == 1)
            {
                laser.x+=2;
            } 
            else 
            {
                laser.x-=2;
            }
        }
    }

    function addLaserToBeDestroyed(laser)
    {
        lasersToDestroy.push(laser)
    }

    /***
    *
    ***/

    function moveEnemies()
    {
        for (i = 0; i < enemies.children.length; i++)
        {
            enemy = enemies.children[i];
            speed = enemy.speed;

            if (enemy.x >= 775)
                enemy.direction = -1;
            
            if (enemy.x <= 15) 
                enemy.direction = 1;

            //setDirectionAnimation(enemy);
            if (enemy.lastY !== enemy.body.y.toFixed(2)){
                enemy.lastY = enemy.body.y.toFixed(2)
                setStandingAnimation(enemy);
            }
            else 
            {
                setDirectionAnimation(enemy);
            }

            if (enemy.direction > 0)
            {
                enemy.x+= speed;
            }
            else 
            {
                enemy.x-= speed;
            }
        }
    }

    function laserHasHitEnemy()
    {
        for (i = 0; i < enemies.children.length; i++)
        {
            enemy = enemies.children[i];
            for(x = 0; x < lasers.children.length; x++)
            {
                laser = lasers.children[x];
                game.physics.arcade.overlap(laser, enemy, function(){
                    enemyHitByLaser(enemy, laser)
                });
            }   
        }
    }

    function checkIfEnemyHasHitPlayer()
    {
        for (i = 0; i < enemies.children.length; i++)
        {
            enemy = enemies.children[i]

            game.physics.arcade.overlap(enemy, player, function(){
                playerHit(enemy, player)
            });
        }
    }

    /***
    * If player is hit then end the game.
    * Kill the player and show the play again screen
    ***/

    function playerHit(enemy, player)
    {
        playSound('death');
        stopThemeCheck()
        player.kill();
        showPlayAgainButton();
        game.over = true;
    }

    /***
    * shows the play again screen
    ***/

    function showPlayAgainButton()
    {
        ms = 5000
        //sounds['theme'].fadeOut(ms)
        setTimeout(function(){
            renderEndScreen();
            //game.paused = true;
        }, ms)
        
    }

    /***
    * Callback when an enemy has been hit
    ***/

    function enemyHitByLaser(enemy, laser)
    {
        damage = LASER_DAMAGE/currentWave;
        enemy.health = (enemy.health - damage).toFixed(2);
        playSound('explosion');
        addLaserToBeDestroyed(laser);

        // bit of a hack here because of js float point being weird
        if ( (enemy.health - 0.01) <= 0  && ( ! enemyCannotBeHit(enemy)))
        {
            currentScore+= SCORE_INCREMENT*currentWave;
            enemy.destroy();
            incrementWavesAndLevels();
        }
        else 
        {
            if (enemy.cannotBeHit === undefined)
            {
                if ( ! enemyCannotBeHit(enemy))
                {
                    enemyCannotBeHit(enemy, true)
                    enemyHitAnimation(enemy, ENEMY_HIT_ANIMATION_MS, ENEMY_HIT_ANIMATION_INTERVALS)
                }
            }
        }
    }

    /***
    * Sets or returns value value of cannot be hit.
    ***/

    function enemyCannotBeHit(enemy, value)
    {
        if (value === undefined)
            return enemy.cannotBeHit;

        enemy.cannotBeHit = value;
    }

    function enemyCanBeHit(enemy, value)
    {
        if (enemy.hasOwnProperty(enemyCannotBeHit))
        {
            enemy.enemyCannotBeHit ? false : true
        }

        return true;
    }

    /***
    * Runs an enemy hit animation using tints
    ***/

    function enemyHitAnimation(enemy, ms, intervals)
    {
        intervalTimeout = ms * intervals;
        intervalAnimation = setInterval(function()
        {
            if (enemy.tint === ENEMY_DAMAGE_TINT)
            {
                enemy.tint = 0xFFFFFF;
            }
            else 
            {
                enemy.tint = ENEMY_DAMAGE_TINT; 
            }
        }, ENEMY_HIT_ANIMATION_MS);

        (function(intervalAnimation, enemy){

            setTimeout(function(){
                clearInterval(intervalAnimation);
                enemyCannotBeHit(enemy, false);
            }, intervalTimeout);

        })(intervalAnimation, enemy)
    }

    /***
    * Plays a sound in our sounds object
    ***/

    function playSound(key, loop)
    {
        if ( ! muted)
        {
            if (loop == undefined) loop = false;

            if (sounds.hasOwnProperty(key))
            {
                sounds[key].play();
                //sounds[key].loop = loop;
            }
        }
    }

    /***
    * Hack to check sound because looping and mp3 doesnt seem to work. 
    ***/

    function resartThemeMusicIfEnded()
    {
        if ( ! muted)
        {
            themeLoopCheck = setInterval(function()
            {

                duration = Math.round(sounds['theme'].durationMS)
                currentTime = Math.round(sounds['theme'].currentTime)

                // music wont start???
                // remove track then add again

                if (duration > 0 && currentTime >= duration)
                {
                    //console.log('play')
                    // destroy and re add here
                    //sounds['theme'].stop()
                    sounds['theme'].play()
                    //playSound('theme', true) 
                    //game.add.audio('theme').play()
                }
            }, 1);
        }
    }

    function stopThemeCheck()
    {
        themeLoopCheck = null
    }

    /***
    * Pauses a sound in the sound object if the key passed is available
    *
    * @param string key
    ***/

    function pauseSound(key)
    {
        if (sounds.hasOwnProperty(key))
            sounds[key].pause()
    }

    /***
    * Resets the jump pressed value to 0 so that the player can jump again
    ***/

    function resetJumpPressed()
    {
        jumpPressed = 0
    }

    /***
    * Renders the games end screen
    ***/

    function renderEndScreen()
    {
        // hide canvas
        // show end screen 
        // set score
        document.querySelector('.score-message').innerHTML = currentScore;
        document.querySelector('canvas').style.display= 'none'
        document.querySelector('.end-screen').style.display = 'block';
    }

    /***
    * Hides the games end screen
    ***/

    function hideEndScreen()
    {
        document.querySelector('canvas').style.display= 'block'
        document.querySelector('.end-screen').style.display = 'none';
    }

    /***
    * Adds any event listeners needed
    ***/

    function addEventListeners()
    {
        document.querySelector('.js-play-again').addEventListener('click', restart) 
    }

    /***
    * Restarts a game
    ***/

    function restart()
    {
        // reset score, level, wave
        // put player at top of screen
        // hide end screen
        // destroy enemies and readd
        // set player to 0,0
        // play sound again
        resetWaves();
        renderGameInfo();
        //player.x = 20;
        player.y = 0;
        setPlayerX();
        player.revive();
        game.paused = false;
        game.over = false;

        //sounds['theme'].restart('', 0, volume);
        //resartThemeMusicIfEnded();

        removeChildren(enemies);
        createEnemies(1);
        hideEndScreen();
    }

    function resetWaves()
    {   
        currentScore = 0;
        currentWave = 1;
        currentLevel = 1;
    }

    /***
    * Removes all children from a group by destorying them
    ***/

    function removeChildren(group)
    {
        for (var i = group.children.length - 1; i >= 0; i--) {
            group.children[i].destroy()
        };
    }

})()