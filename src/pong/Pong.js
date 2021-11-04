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
    middleLine: null,
    paddleLeft: null,
    paddleRight: null,
    ball: null,
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
    drawPongWorld();
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
    gl.uniform2f(ctx.uScreenResolutionId, 800, 600);
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
function updatePongWorld() {

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

    // Demo 1.
    var scale = mat3.fromScaling(mat3.create(), vec2.fromValues(40, 100));
    var rotation = mat3.fromRotation(mat3.create(), -0.1);
    var translation1 = mat3.fromTranslation(mat3.create(), vec2.fromValues(200, 300));
    var translation2 = mat3.fromTranslation(mat3.create(), vec2.fromValues(600, 300));

    var transform1 = mat3.create();
    mat3.multiply(transform1, scale, transform1);
    mat3.multiply(transform1, rotation, transform1);
    mat3.multiply(transform1, translation1, transform1);

    //drawRectangle(transform1, vec4.fromValues(1,1,1,1));

    // Demo 2.
    var transform2 = mat3.create();
    mat3.multiply(transform2, scale, transform2);
    mat3.multiply(transform2, rotation, transform2);
    mat3.multiply(transform2, translation2, transform2);

    //drawRectangle(transform2, vec4.fromValues(0,1,0,1));
}

function drawGameModel(model) {
    "use strict";
    console.log("Drawing model...");

    var modelMatrix = mat3.copy(mat3.create(), model.modelMatrix);

    var moveToPosition = mat3.fromTranslation(mat3.create(), model.position);
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
        vec4.fromValues(1, 1, 1, 1),
        vec2.fromValues(100, 300));

    pongWorld.paddleRight = createGameModel(
        vec2.fromValues(10, 100),
        vec4.fromValues(1, 1, 1, 1),
        vec2.fromValues(700, 300));

    pongWorld.ball = createGameModel(
        vec2.fromValues(20, 20),
        vec4.fromValues(1, 0.5, 0.5, 1),
        vec2.fromValues(400, 300));
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

    var scaleToSize = mat3.fromScaling(mat3.create(), size);
    var model = {
        modelMatrix: scaleToSize,
        color: color,
        position: startingPosition,
    }

    return model;
}

/**
 * Creates a model matrix for a specific game model. The model matrix describes the object in its shape, and does not
 * change during the game.
 * @param {vec2} the model size
 * @returns {mat3} the model matrix
 */
function createGameModelMatrix(size) {
    "use strict";

    var scaleToSize = mat3.fromScaling(mat3.create(), size);

    return scaleToSize;
}