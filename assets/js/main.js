(function(){

    MAX_WAVE = 10;
    MAX_LEVEL = 7;
    WIDTH = 800;
    HEIGHT = 450;
    BULLET_DAMAGE = 1;
    BULLET_TIMEOUT = 1000;
    SCORE_INCREMENT = 100;
    JUMP_PRESS_MAX = 2;

    PLAYER_SPEED = 2;

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

    var bullet;

    var canFireBullet = true;

    var sounds = {};

    var backgroundObjects = [
        {x: 30, y: 350, sprite: 'lampost'},
        {x: 380, y: 350, sprite: 'lampost'},
        {x: 730, y: 350, sprite: 'lampost'},
    ]

    var foregroundObjects = [
        {x: 50, y: 405, sprite: 'rubbish_bin'},
        {x: 400, y: 405, sprite: 'rubbish_bin'},
        {x: 750, y: 405, sprite: 'rubbish_bin'},
    ]

    var inputStates = {
        39: function(){ movePlayerForward(PLAYER_SPEED) },
        37: function(){ movePlayerBackward(PLAYER_SPEED) },
        //38: function(){ playerJump() },
        32: function(){ fireBullet() }
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
       game.load.spritesheet('bullet_spritemap', 'assets/img/laser_spritemap.png', 23, 11);

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
        bullet = createBullet();

        enemies = game.add.group();
        enemies.enableBody = true;
        enemies.physicsBodyType = Phaser.Physics.ARCADE;
        createEnemies(1)

        addEventListeners()

        game.input.keyboard.onDownCallback = function()
        {
            // add jump timeout fix weird double jump problem
            if ((game.input.keyboard.lastKey.keyCode == 38)  && (! game.over))
                playerJump();
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
        moveBullet();
        checkIfBulletHasHitEnemy();
        checkIfEnemyHasHitPlayer();
        game.physics.arcade.collide(platforms, player);

        game.physics.arcade.collide(platforms, enemies);

        checkInput();

        if (player.body.touching.down)
        {
            resetJumpPressed()
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
        platform = game.add.group();
        platform.enableBody = true;

        floorPlatform = platform.create(0, 0, 'floor');
        floorPlatform.y = HEIGHT - floorPlatform.height
        floorPlatform.width = WIDTH;
        floorPlatform.body.immovable = true;

        platformOne = platform.create(50, 150, 'platform_medium');
        //platformOne.width = WIDTH/4;
        platformOne.body.immovable = true; 

        platformTwo = platform.create(300, 250, 'platform_medium');
        //platformTwo.width = WIDTH/4;
        platformTwo.body.immovable = true;

        platformThree = platform.create(500, 340, 'platform_medium');
        //platformThree.width = WIDTH/4;
        platformThree.body.immovable = true;

        platformFour = platform.create(550, 140, 'platform_medium');
        //platformFour.width = WIDTH/4;
        platformFour.body.immovable = true;

        return platform;
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

        player.direction = 1;
        setStandingAnimation(player)

        return player;
    }

    /***
    * Creates all the enemies needed for a particular wave
    * @return void
    ***/

    function createEnemies(amount)
    {
        for (i = 0; i < amount; i++)
        {
            enemy = enemies.create(getRandomVal(WIDTH), 0, 'enemy_spritemap')
            enemy.anchor.setTo(.5, 1);
            enemy.body.bounce.y = 0.2;
            enemy.body.gravity.y = 300;
            enemy.body.collideWorldBounds = true; 
            enemy.direction = chooseValueAtRandom(-1, 1);
            enemy.speed = getRandomFloat(2, 0.5);
            enemy.lastY = Math.round(enemy.body.y)

            enemy.body.setSize(22, 35, 0, 0);
            enemy.animations.add('standing_left', [12, 13, 14, 15], 8, true);
            enemy.animations.add('standing_right', [0, 1, 2, 3], 8, true);
            enemy.animations.add('walking_right', [4, 5, 6, 7], 8, true);
            enemy.animations.add('walking_left', [8, 9, 10, 11], 8, true);

            setDirectionAnimation(enemy);
        }

        // make sure our bullet and foreground objects are in front of the enemies
        game.world.bringToTop(bullet);
        game.world.bringToTop(foregroundObjects);
        
    }

    function createBullet()
    {
        bullet = game.add.sprite(0, 0, 'bullet_spritemap');
        game.physics.arcade.enable(bullet);
        bullet.body.setSize(11, 23, 0, 0);
        bullet.animations.add('fire_right', [0, 1, 2, 3, 4, 5], 6, true);
        bullet.animations.add('fire_left', [6, 7, 8, 9, 10, 11], 6, true);

        //bullet.anchor.setTo(0.5, 1);
        bullet.checkWorldBounds = true;

        bullet.events.onOutOfBounds.add(function(bullet){ 
            bullet.kill() 
        }, this );

        setBulletPosition()

        bullet.kill();
        return bullet;
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
            player.body.velocity.y = -250;
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

    function getRandomVal(max, min)
    {
        if (min == undefined)
            min = 70;

        return Math.floor((Math.random() * max) + min);
    }

    function getRandomFloat(max, min)
    {
        return (Math.random() * max) + min;
    }

    function chooseValueAtRandom(valueOne, valueTwo)
    {
        return Math.random() < 0.5 ? valueOne : valueTwo;
    }

    function fireBullet()
    {
        if ( ! bullet.alive && canFireBullet)
        {
            setBulletPosition();
            setBulletDirection();
            bullet.revive();
            playSound('blast');

            canFireBullet = false
            setTimeout(function(){
                canFireBullet = true;
            }, BULLET_TIMEOUT)
        }
    }

    /***
    *
    ***/

    function moveBullet()
    {
        // use direct to know if we should increment or decrement
        if (bullet.alive)
        {
            if (bullet.direction == 1)
            {
                bullet.x+=2;
                bullet.animations.play('fire_right');
            } 
            else 
            {
                bullet.x-=2;
                bullet.animations.play('fire_left');
            }
            
        }
    }

    function setBulletPosition()
    {
        // base on direction, do we place front of back of sprite
        if (player.direction == 1)
        {
            bullet.body.x = player.body.x + 20;
        }
        else {
            bullet.body.x = player.body.x - 20;
        }
        bullet.body.y = player.body.y + 10;
    }

    /***
    * Set the bullet direction based on the direction the player is moving
    ***/

    function setBulletDirection()
    {
        if (player.direction == -1)
        {
            bullet.direction = -1;
            //bullet.scale.x = -1;
        }
        else 
        {
            bullet.direction = 1;
            //bullet.scale.x = 1;
        }
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
            speed = 1;

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

    /***
    *
    ***/

    function checkIfBulletHasHitEnemy()
    {
        for (i = 0; i < enemies.children.length; i++)
        {
            enemy = enemies.children[i]

            game.physics.arcade.overlap(bullet, enemy, function(){
                enemyHit(enemy, bullet)
            });
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
    * Callback when a players bullet hits the enemy
    * Removes health or kills the enemies, inncrement score, waves and levels.
    ***/

    function enemyHit(enemy, bullet)
    {
        // take off health
        // if health less than or equal to 0, destroy

        if ( ! bullet.hasCollided )
        {
            damage = BULLET_DAMAGE/currentWave;
            enemy.health = (enemy.health - damage).toFixed(2);
            playSound('explosion');
            bullet.kill();

            // bit of a hack here because of js float point being weird
            if ( (enemy.health - 0.01) <= 0)
            {
                currentScore+= SCORE_INCREMENT*currentWave;
                enemy.destroy();
                incrementWavesAndLevels();
            }
        }
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
        player.x = 20;
        player.y = 0;
        player.revive();
        game.paused = false;
        game.over = true;

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
        for (i = 0; i < group.children.length; i++)
        {
            enemies.children[i].destroy()
        }
    }

})()