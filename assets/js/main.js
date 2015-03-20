(function(){

    MAX_WAVE = 10;
    MAX_LEVEL = 5;
    WIDTH = 800;
    HEIGHT = 450;
    BULLET_DAMAGE = 1;
    BULLET_TIMEOUT = 500;

    PLAYER_SPEED = 2;

    var currentLevel = 1;
    var currentWave = 1;

    var game = new Phaser.Game(800, 450, Phaser.AUTO, 'game', { preload: preload, create: create, update: update });

    var background;

    var platforms;

    var enemies;

    var player;

    var bullet;

    var canFireBullet = true;

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
       game.load.spritesheet('player_spritemap', 'assets/img/player_spritemap.png', 22, 35);
       game.load.spritesheet('enemy_spritemap', 'assets/img/enemy_spritemap.png', 22, 35);
       game.load.spritesheet('bullet_spritemap', 'assets/img/bullet_spritemap.png', 28, 15);
       //game.load.image('bullet', 'assets/img/bullet.png', 0, 0);

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

        playSound('theme', true);
    
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

        game.input.keyboard.onUpCallback = function()
        {
            setStandingAnimation(player);
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
        setDirectionAnimation(player)
    }

    function movePlayerBackward(speed)
    {
        player.x -= speed;
        player.direction = -1;
        setDirectionAnimation(player)
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
        player = game.add.sprite(0, 0, 'player_spritemap');
        game.physics.arcade.enable(player);
        //player.anchor.setTo(.5, 1);
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
            enemy = enemies.create(getRandomVal(WIDTH), 0, 'enemy_spritemap')
            enemy.anchor.setTo(.5, 1);
            enemy.body.bounce.y = 0.2;
            enemy.body.gravity.y = 300;
            enemy.body.collideWorldBounds = true; 
            enemy.direction = chooseValueAtRandom(-1, 1);
            enemy.speed = getRandomFloat(2, 0.5);

            enemy.body.setSize(22, 35, 0, 0);
            enemy.animations.add('standing_left', [12, 13, 14, 15], 8, true);
            enemy.animations.add('standing_right', [0, 1, 2, 3], 8, true);
            enemy.animations.add('walking_right', [4, 5, 6, 7], 8, true);
            enemy.animations.add('walking_left', [8, 9, 10, 11], 8, true);

            setDirectionAnimation(enemy);
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
        bullet = game.add.sprite(0, 0, 'bullet_spritemap');
        game.physics.arcade.enable(bullet);
        bullet.body.setSize(15, 28, 0, 0);
        bullet.animations.add('fire_right', [0, 1, 2, 3], 8, true);
        bullet.animations.add('fire_left', [4, 5, 6, 7], 8, true);

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
            {
                enemy.direction = -1;
                //enemy.scale.x = -1;
                setDirectionAnimation(enemy);
            }
            
            if (enemy.x <= 15) 
            {
                enemy.direction = 1;
                //enemy.scale.x = 1;
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

    function playSound(key, loop)
    {
        if (loop == undefined) loop = false;
        if (sounds.hasOwnProperty(key))
            sounds[key].play().loop = loop;
    }

    function pauseSound(key)
    {
        if (sounds.hasOwnProperty(key))
            sounds[key].pause()
    }

})()