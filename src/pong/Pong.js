//
// DI Computer Graphics
//
// WebGL Exercises
//

// Register function to call after document has loaded.
window.onload = startup;

// The gl object is saved globally.
var gl;

// We keep all local parameters for the program in a single object.
var ctx = {
    shaderProgram: -1,

    aVertexPositionId: -1,
    uScreenResolutionId: -1,
    uProjectionMatrixId: -1,
    uColorId: -1,
};

// We keep all the parameters for drawing a specific object together.
var rectangleObject = {
    buffer: -1,
};

// We keep the state of the "game world" in a single structure.
var pongWorld = {
    // fixed properties
    size: vec2.fromValues(800, 600),
    paddleSpeed: 200,
    ballSpeed: 200,

    // models
    middleLine: null,
    paddleLeft: null,
    paddleRight: null,
    ball: null,

    // game state
    worldTime: -1,
    isFinished: false,
    enemyAI: null,
}

/**
 * Startup function to be called when the body is loaded
 */
function startup() {
    "use strict";
    var canvas = document.getElementById("myCanvas");
    gl = createGLContext(canvas);
    initGL();
    window.addEventListener('keyup', onKeyup, false);
    window.addEventListener('keydown', onKeydown, false);

    initializePongWorld();
    window.requestAnimationFrame(drawAnimated);
}

/**
 * InitGL should contain the functionality that needs to be executed only once
 */
function initGL() {
    "use strict";
    ctx.shaderProgram = loadAndCompileShaders(gl, 'Shaders\\VertexShader.glsl', 'Shaders\\FragmentShader.glsl');
    setUpAttributesAndUniforms();
    setUpBuffers();
    
    gl.clearColor(0.2, 0.25, 0.2, 1);
}

/**
 * Setup all the attribute and uniform variables
 */
function setUpAttributesAndUniforms(){
    "use strict";
    ctx.aVertexPositionId = gl.getAttribLocation(ctx.shaderProgram, "aVertexPosition");
    ctx.uScreenResolutionId = gl.getUniformLocation(ctx.shaderProgram, "uScreenResolution");
    ctx.uProjectionMatrixId = gl.getUniformLocation(ctx.shaderProgram, "uProjectionMatrix");
    ctx.uColorId = gl.getUniformLocation(ctx.shaderProgram, "uColor");
}

/**
 * Setup the buffers to use. If more objects are needed this should be split in a file per object.
 */
function setUpBuffers(){
    "use strict";
    rectangleObject.buffer = gl.createBuffer();
    var vertices = [
        -0.5, -0.5,
        0.5, -0.5,
        -0.5, 0.5,
        0.5, 0.5];
    gl.bindBuffer(gl.ARRAY_BUFFER, rectangleObject.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
}

/**
 * Calculates a step in the game, and draws the animated frame.
 * @param timeStamp
 */
function drawAnimated (timeStamp) {
    "use strict";
    console.log("Rendering animated frame...");

    updatePongWorld(timeStamp);
    drawPongWorld();

    // Request the next frame.
    window.requestAnimationFrame(drawAnimated);
}


/**
 * Draws the scene.
 * @param {mat3} prjectionMatrix a projection matrix which is applied to the rectangle
 * @param {vec4} colorRgb the RGB color the rectangle is drawn with
 */
function drawRectangle(prjectionMatrix, colorRgb) {
    "use strict";
    console.log("Drawing rectangle...");

    gl.bindBuffer(gl.ARRAY_BUFFER, rectangleObject.buffer);
    gl.vertexAttribPointer(ctx.aVertexPositionId, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(ctx.aVertexPositionId);

    // Set shader parameters.
    gl.uniform2f(ctx.uScreenResolutionId, pongWorld.size[0], pongWorld.size[1]);
    gl.uniformMatrix3fv(ctx.uProjectionMatrixId, false, prjectionMatrix);
    gl.uniform4f(ctx.uColorId, colorRgb[0], colorRgb[1], colorRgb[2], colorRgb[3]);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

// Key Handling
var key = {
    _pressed: {},

    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
};

function isDown (keyCode) {
    return key._pressed[keyCode];
}

function onKeydown(event) {
    key._pressed[event.keyCode] = true;
}

function onKeyup(event) {
    delete key._pressed[event.keyCode];
}

/**
 * Updates the entire "Pong World".
 */
function updatePongWorld(timeStamp) {
    "use strict";

    if (pongWorld.isFinished) {
        return;
    }

    // Calculate time passed, handle timestamp.
    if (pongWorld.worldTime < 0) {
        pongWorld.worldTime = timeStamp;
        return;
    }

    var timePassed = (timeStamp - pongWorld.worldTime) / 1000;
    pongWorld.worldTime = timeStamp;

    // Move the paddles.
    if (isDown(key.UP)) {
        movePaddle(pongWorld.paddleLeft, pongWorld.paddleSpeed * timePassed);
    }

    if (isDown(key.DOWN)) {
        movePaddle(pongWorld.paddleLeft, 0 - pongWorld.paddleSpeed * timePassed);
    }

    updateEnemyAI(timePassed);
    movePaddle(pongWorld.paddleRight,pongWorld.enemyAI.movingDirection * pongWorld.paddleSpeed * timePassed)

    /*
    if (isDown(key.RIGHT)) {
        movePaddle(pongWorld.paddleRight, pongWorld.paddleSpeed * timePassed);
    }

    if (isDown(key.LEFT)) {
        movePaddle(pongWorld.paddleRight, 0 - pongWorld.paddleSpeed * timePassed);
    }
    */

    // Move the ball.
    var ballPositionOffset = vec2.scale(vec2.create(), pongWorld.ball.velocity, timePassed);
    vec2.add(pongWorld.ball.position, pongWorld.ball.position, ballPositionOffset);

    solveBallCollisions();

    // Has left player won?:
    if (pongWorld.ball.position[0] > pongWorld.size[0]) {
        pongWorld.isFinished = true;
        pongWorld.paddleLeft.color = vec4.fromValues(0.9, 0.9, 0.1, 1);
    }

    // Has right player won?:
    if (pongWorld.ball.position[0] < 0) {
        pongWorld.isFinished = true;
        pongWorld.paddleRight.color = vec4.fromValues(0.9, 0.9, 0.1, 1);
    }
}

/**
 * Updates the moving direction of the enemy AI.
 * @param timePassed the time (in seconds) passed since the last update
 */
function updateEnemyAI(timePassed) {
    pongWorld.enemyAI.coolDownTime -= timePassed;
    if (pongWorld.enemyAI.coolDownTime > 0) {
        // still cooling down...
        return;
    }

    // By default, we do nothing.
    pongWorld.enemyAI.movingDirection = 0;

    var ball = pongWorld.ball;
    var paddle = pongWorld.paddleRight;
    var playerPaddle = pongWorld.paddleLeft;

    // Is the ball approaching the enemy?
    if (ball.velocity[0] > 0) {
        // Follow the ball.
        if (ball.position[1] > (paddle.position[1] + paddle.size[1] / 2)) {
            pongWorld.enemyAI.movingDirection = 1;
        }

        if (ball.position[1] < (paddle.position[1] - paddle.size[1] / 2)) {
            pongWorld.enemyAI.movingDirection = -1;
        }
    }
    else {
        // Follow the player.
        if (playerPaddle.position[1] > paddle.position[1] + paddle.size[1]) {
            pongWorld.enemyAI.movingDirection = 1;
        }

        if (playerPaddle.position[1] < paddle.position[1] - paddle.size[1]) {
            pongWorld.enemyAI.movingDirection = -1;
        }
    }

    pongWorld.enemyAI.coolDownTime = Math.random() * 1.1 + 0.2;
}

/**
 * Moves the specified paddle by the specified y-offset, and within the world bounds.
 * @param paddle the paddle to move
 * @param yOffset the y-offset by which to move the paddle
 */
function movePaddle(paddle, yOffset) {
    var min = paddle.size[1] / 2;
    var max = pongWorld.size[1] - (paddle.size[1] / 2);

    paddle.position[1] += yOffset;

    if (paddle.position[1] < min) {
        paddle.position[1] = min;
    }

    if (paddle.position[1] > max) {
        paddle.position[1] = max;
    }
}

/**
 * Solves all the possible collisions of the ball with all other stuff.
 */
function solveBallCollisions() {
    "use strict";

    var r = pongWorld.ball.size[0] / 2;

    var pos = pongWorld.ball.position;
    var v = pongWorld.ball.velocity;

    // upper world bound:
    if (pos[1] > (pongWorld.size[1] - r) && v[1] > 0) {
        v[1] = 0 - v[1];
    }

    // lower world bound:
    if (pos[1] < r && v[1] < 0) {
        v[1] = 0 - v[1];
    }

    // paddles;
    if (doModelsCollide(pongWorld.ball, pongWorld.paddleLeft) && v[0] < 0) {
        v[0] = 0 - v[0];
        randomRotateVector(v, 0.5);
    }

    if (doModelsCollide(pongWorld.ball, pongWorld.paddleRight) && v[0] > 0) {
        v[0] = 0 - v[0];
        randomRotateVector(v, 0.5);
    }
}

/**
 * Random rotates the specified vector 2 by a maximum of the specified max absolute radians.
 * @param vector2 the vector to rotate
 * @param maxAbsRad the maximum absolute radians by which to rotate
 */
function randomRotateVector(vector2, maxAbsRad) {
    var rad = ((Math.random() - 0.5) * 4 * Math.PI) % maxAbsRad;
    var rotate =  mat2.fromRotation(mat2.create(), rad);
    var rotatedV = mat2.multiply(mat2.create(), rotate, mat2.fromValues(vector2[0], vector2[1], 0, 0));

    if (Math.abs(rotatedV[0] / rotatedV[1]) > 1.5) {
        vector2[0] = rotatedV[0];
        vector2[1] = rotatedV[1];
    }
}

/**
 * Determines whether two specified models, A and B, are currently colliding.
 * @param a model A
 * @param b model B
 * @returns {boolean} a value which indicates whether they collide
 */
function doModelsCollide(a, b) {
    var aLeftBound = a.position[0] - (a.size[0] / 2);
    var aRightBound = a.position[0] + (a.size[0] / 2);
    var aLowerBound = a.position[1] - (a.size[1] / 2);
    var aUpperBound = a.position[1] + (a.size[1] / 2);

    var bLeftBound = b.position[0] - (b.size[0] / 2);
    var bRightBound = b.position[0] + (b.size[0] / 2);
    var bLowerBound = b.position[1] - (b.size[1] / 2);
    var bUpperBound = b.position[1] + (b.size[1] / 2);

    if (aRightBound < bLeftBound ||
        aLeftBound > bRightBound ||
        aUpperBound < bLowerBound ||
        aLowerBound > bUpperBound) {
        return false;
    }
    else {
        return true;
    }
}

/**
 * Draws the entire "Pong World".
 */
function drawPongWorld() {
    "use strict";

    // Clear screen.
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Draw the game models.
    drawGameModel(pongWorld.middleLine);
    drawGameModel(pongWorld.paddleLeft);
    drawGameModel(pongWorld.paddleRight);
    drawGameModel(pongWorld.ball);
}

/**
 * Draws a sinlge drawable game model to the screen.
 * @param model the model to draw
 */
function drawGameModel(model) {
    "use strict";
    console.log("Drawing model...");
    console.log(model.position);

    var scaleToSize = mat3.fromScaling(mat3.create(), model.size);
    var moveToPosition = mat3.fromTranslation(mat3.create(), model.position);

    var modelMatrix = mat3.create();
    mat3.multiply(modelMatrix, scaleToSize, modelMatrix);
    mat3.multiply(modelMatrix, moveToPosition, modelMatrix);

    drawRectangle(modelMatrix, model.color);
}

/**
 * Initializes the "Pong World".
 */
function initializePongWorld() {
    "use strict";

    pongWorld.middleLine = createGameModel(
        vec2.fromValues(2, 560),
        vec4.fromValues(1, 1, 1, 0.9), // light gray
        vec2.fromValues(400, 300));

    pongWorld.paddleLeft = createGameModel(
        vec2.fromValues(10, 100),
        vec4.fromValues(0.4, 0.5, 0.7, 1), // blue
        vec2.fromValues(100, 300));

    pongWorld.paddleRight = createGameModel(
        vec2.fromValues(10, 100),
        vec4.fromValues(0.4, 0.5, 0.7, 1), // blue
        vec2.fromValues(700, 300));

    pongWorld.ball = createGameModel(
        vec2.fromValues(20, 20),
        vec4.fromValues(1, 0.5, 0.5, 1), // red
        vec2.fromValues(400, 300));

    // Set a (more or less) random initial ball velocity, scale to "ball speed".
    var ballVelocity = vec2.fromValues(
        -1 + (Math.random() - 0.5),
        Math.random() - 0.5);

    vec2.normalize(ballVelocity, ballVelocity);
    vec2.scale(ballVelocity, ballVelocity, pongWorld.ballSpeed);

    pongWorld.ball.velocity = ballVelocity;

    // game state:
    pongWorld.worldTime = -1;
    pongWorld.isFinished = false;

    pongWorld.enemyAI = {
        coolDownTime: 0,
        movingDirection: 0,
    };
}

/**
 * Initializes a drawable "game model" which has a shape (model matrix), a color, and a position (which might change during the game).
 * @param {vec2} size the model's size
 * @param {vec4} color the model's color
 * @param {vec2} startingPosition the model's starting position
 * @returns {{color: *, modelMatrix: mat3, position: *}}
 */
function createGameModel(size, color, startingPosition) {
    "use strict";

    var model = {
        size: size,
        color: color,
        position: startingPosition,
    }

    return model;
}