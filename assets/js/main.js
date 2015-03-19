(function(){

    MAX_WAVE = 10;
    MAX_LEVEL = 10;
    WIDTH = 800;
    HEIGHT = 450;

    PLAYER_SPEED = 2;

    var currentLevel = 1;
    var currentWave = 1;

    var game = new Phaser.Game(800, 450, Phaser.AUTO, 'game', { preload: preload, create: create, update: update });

    var background;

    var platforms;

    var enemies;

    var player;

    var bullet;

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
       game.load.image('bullet', 'assets/img/bullet.png', 0, 0);
    }

    function create()
    {
        game.physics.startSystem(Phaser.Physics.ARCADE);

        background = createBackground();
        platforms = createPlatforms();
        player = createPlayer();
        bullet = createBullet();

        enemies = game.add.group();
        enemies.enableBody = true;
        enemies.physicsBodyType = Phaser.Physics.ARCADE;
        createEnemies(1)
    }

    function update()
    {
        if (allChildrenAreDead(enemies))
        {
            incrementWavesAndLevels();
            createEnemies(currentWave);
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
        //floorPlatform.y = 100;
        floorPlatform.width = WIDTH;
        floorPlatform.body.immovable = true;

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
            }

            createEnemies(currentLevel);
        }

        document.getElementById('level').innerHTML = currentLevel;
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
            e = enemies.create(getRandomVal(WIDTH), getRandomVal(HEIGHT), 'player')
            e.anchor.setTo(.5, 1);
            e.body.bounce.y = 0.2;
            e.body.gravity.y = 300;
            e.body.collideWorldBounds = true; 
            e.direction = 1;   
        }
        
    }

    function getRandomVal(max, min)
    {
        if (min == undefined)
            min = 70;

        return Math.floor((Math.random() * max) + min);
    }

    function createBullet()
    {
        bullet = game.add.sprite(0, 0, 'bullet');
        game.physics.arcade.enable(bullet);
        bullet.anchor.setTo(.5, 1);
        bullet.kill();
        bullet.checkWorldBounds = true;

        bullet.events.onOutOfBounds.add(function(bullet){ 
            bullet.kill() 
        }, this );

        setBulletPosition()

        return bullet;
    }

    function fireBullet()
    {
        if ( ! bullet.alive)
        {
            setBulletPosition();
            setBulletDirection();
            bullet.revive();
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
                enemy.direction = -1;
                enemy.scale.x = -1;
            }
            
            if (enemy.x <= 15) 
            {
                enemy.direction = 1;
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

            game.physics.arcade.overlap(enemy, bullet, function(){
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
        game.paused = true;
    }

    function enemyHit(enemy, bullet)
    {
        enemy.destroy();
        bullet.kill();
        incrementWavesAndLevels();
    }

})()