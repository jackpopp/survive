(function(){

    MAX_WAVE = 10;
    MAX_LEVEL = 5;
    WIDTH = 800;
    HEIGHT = 450;
    BULLET_DAMAGE = 1;

    PLAYER_SPEED = 2;

    var currentLevel = 1;
    var currentWave = 1;

    var game = new Phaser.Game(800, 450, Phaser.AUTO, 'game', { preload: preload, create: create, update: update });

    var background;

    var platforms;

    var enemies;

    var player;

    var bullet;

    var sounds = {};

    var inputStates = {
        39: function(){ movePlayerForward(PLAYER_SPEED) },
        37: function(){ movePlayerBackward(PLAYER_SPEED) },
        38: function(){ playerJump() },
        32: function(){ fireBullet() }
    };

    function preload()
    {
       game.load.image('background', 'assets/img/background_two.jpg', 0, 0);
       game.load.image('floor', 'assets/img/floor.png', 0, 0);
       game.load.image('player', 'assets/img/player.png', 0, 0);
       game.load.image('enemy', 'assets/img/enemy.png', 0, 0);
       game.load.image('bullet', 'assets/img/bullet.png', 0, 0);

       game.load.audio('blast', ['assets/audio/blast.wav']);
       game.load.audio('jump', ['assets/audio/jump.wav']);
       game.load.audio('explosion', ['assets/audio/explosion.wav']);
       game.load.audio('theme', ['assets/audio/theme_two.mp3']);
       game.load.audio('death', ['assets/audio/death_three.wav']);
       game.load.audio('level_up', ['assets/audio/level_up.wav']);
       // http://www.bfxr.net/

    }

    function create()
    {
        game.physics.startSystem(Phaser.Physics.ARCADE);

        sounds['blast'] = game.add.audio('blast');
        sounds['jump'] = game.add.audio('jump');
        sounds['explosion'] = game.add.audio('explosion');
        sounds['theme'] = game.add.audio('theme');
        sounds['death'] = game.add.audio('death');
        sounds['level_up'] = game.add.audio('level_up');

        playSound('theme');
    
        background = createBackground();
        platforms = createPlatforms();
        player = createPlayer();
        bullet = createBullet();

        enemies = game.add.group();
        enemies.enableBody = true;
        enemies.physicsBodyType = Phaser.Physics.ARCADE;
        createEnemies(1)

        game.input.keyboard.onDownCallback = function()
        {
            if (game.input.keyboard.lastKey.keyCode == 38)
                playSound('jump');
        }

        renderGameInfo();
    }

    function update()
    {
        if (allChildrenAreDead(enemies))
        {
            incrementWavesAndLevels();
        }

        moveEnemies();
        moveBullet();
        checkIfBulletHasHitEnemy();
        checkIfEnemyHasHitPlayer();
        game.physics.arcade.collide(platforms, player);
        game.physics.arcade.collide(platforms, enemies);

        checkInput();
    }

    function checkInput()
    {
        for (i = 0; i < game.input.keyboard._keys.length; i++)
        {
            keyCode = getKeyCodeFromKey(game.input.keyboard._keys[i])
            if (inputStates.hasOwnProperty(keyCode))
                return inputStates[keyCode]();
        }
    }

    function getKeyCodeFromKey(key)
    {
        if (key != undefined && key.hasOwnProperty('keyCode') && key.isDown)
            return key.keyCode
    }

    function movePlayerForward(speed)
    {
        player.x += speed;
        player.direction = 1;
        player.scale.x = 1;
    }

    function movePlayerBackward(speed)
    {
        player.x -= speed;
        player.direction = -1;
        player.scale.x = -1;
    }

    function playerJump()
    {
        player.body.velocity.y = -150;
        //playSound('jump');
    }



    function createBackground()
    {
        background = game.add.sprite(0, 0, 'background');
        background.height = HEIGHT;
        background.width = WIDTH;

        return background;
    }

    function createPlatforms()
    {
        platform = game.add.group();
        platform.enableBody = true;

        floorPlatform = platform.create(0, 0, 'floor');
        floorPlatform.y = HEIGHT - floorPlatform.height
        floorPlatform.width = WIDTH;
        floorPlatform.body.immovable = true;

        platformOne = platform.create(50, 150, 'floor');
        platformOne.width = WIDTH/4;
        platformOne.body.immovable = true; 

        platformTwo = platform.create(300, 250, 'floor');
        platformTwo.width = WIDTH/4;
        platformTwo.body.immovable = true;

        platformThree = platform.create(500, 340, 'floor');
        platformThree.width = WIDTH/4;
        platformThree.body.immovable = true;

        platformFour = platform.create(550, 140, 'floor');
        platformFour.width = WIDTH/4;
        platformFour.body.immovable = true;

        return platform;
    }

    function createPlayer()
    {
        player = game.add.sprite(0, 0, 'player');
        game.physics.arcade.enable(player);
        player.anchor.setTo(.5, 1);
        player.body.bounce.y = 0.2;
        player.body.gravity.y = 300;
        player.body.collideWorldBounds = true; 

        return player;
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

    /***
    * Creates all the enemies needed for a particular wave
    * @return void
    ***/

    function createEnemies(amount)
    {
        for (i = 0; i < amount; i++)
        {
            e = enemies.create(getRandomVal(WIDTH), 0, 'enemy')
            e.anchor.setTo(.5, 1);
            e.body.bounce.y = 0.2;
            e.body.gravity.y = 300;
            e.body.collideWorldBounds = true; 
            dir = chooseValueAtRandom(-1, 1);
            e.direction = dir;
            e.scale.x = dir;
            e.speed = getRandomFloat(3, 0.5);
        }

        // make sure our bullet is in front of the enemies
        game.world.bringToTop(bullet);
        
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

    function createBullet()
    {
        bullet = game.add.sprite(0, 0, 'bullet');
        game.physics.arcade.enable(bullet);
        //bullet.anchor.setTo(0.5, 1);
        bullet.checkWorldBounds = true;

        bullet.events.onOutOfBounds.add(function(bullet){ 
            bullet.kill() 
        }, this );

        setBulletPosition()

        bullet.kill();
        return bullet;
    }

    function fireBullet()
    {
        if ( ! bullet.alive)
        {
            setBulletPosition();
            setBulletDirection();
            bullet.revive();
            playSound('blast');
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
            } 
            else 
            {
                bullet.x-=2;
            }
            
        }
    }

    function setBulletPosition()
    {
        // base on direction, do we place front of back of sprite
        bullet.body.x = player.body.x;
        bullet.body.y = player.body.y;
    }

    /***
    * Set the bullet direction based on the direction the player is moving
    ***/

    function setBulletDirection()
    {
        if (player.direction == -1)
        {
            bullet.direction = -1;
            bullet.scale.x = -1;
        }
        else 
        {
            bullet.direction = 1;
            bullet.scale.x = 1;
        }
    }

    /***
    *
    ***/

    function moveEnemies()
    {
        for (i = 0; i < enemies.children.length; i++)
        {
            enemy = enemies.children[i]

            if (enemy.x >= 775)
            {
                enemy.direction = -enemy.speed;
                enemy.scale.x = -1;
            }
            
            if (enemy.x <= 15) 
            {
                enemy.direction = enemy.speed;
                enemy.scale.x = 1;
            }

            if (enemy.direction > 0)
            {
                enemy.x+=1;
            }
            else 
            {
                enemy.x-=1;
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

    function playerHit(enemy, player)
    {
        playSound('death');
        player.kill();
        showPlayAgainButton();
    }

    function showPlayAgainButton()
    {
        sounds['theme'].fadeOut(5000)
        setTimeout(function(){
            game.paused = true;
        }, 5000)
        
    }

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
                enemy.destroy();
                incrementWavesAndLevels();
            }
        }
    }

    function playSound(key)
    {
        if (sounds.hasOwnProperty(key))
            sounds[key].play()
    }

    function pauseSound(key)
    {
        if (sounds.hasOwnProperty(key))
            sounds[key].pause()
    }

})()