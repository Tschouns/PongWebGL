//
// DI Computer Graphics
//
// WebGL Exercises
//

//import {create, fromRotation, fromScaling, fromTranslation, multiply, rotate, vec2} from "./gl-matrix";

// Register function to call after document has loaded
window.onload = startup;

// the gl object is saved globally
var gl;

// we keep all local parameters for the program in a single object
var ctx = {
    shaderProgram: -1,

    aVertexPositionId: -1,
    uScreenResolutionId: -1,
    uProjectionMatrixId: -1,
    uColorId: -1,
};

// we keep all the parameters for drawing a specific object together
var rectangleObject = {
    buffer: -1,
};

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
    drawRectangle();
}

/**
 * InitGL should contain the functionality that needs to be executed only once
 */
function initGL() {
    "use strict";
    ctx.shaderProgram = loadAndCompileShaders(gl, 'Shaders\\VertexShader.glsl', 'Shaders\\FragmentShader.glsl');
    setUpAttributesAndUniforms();
    setUpBuffers();
    
    gl.clearColor(0.2, 0.2, 0.2, 1);
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
 */
function drawRectangle() {
    "use strict";
    console.log("Drawing");
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.bindBuffer(gl.ARRAY_BUFFER, rectangleObject.buffer);
    gl.vertexAttribPointer(ctx.aVertexPositionId, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(ctx.aVertexPositionId);

    // temp:
    var scale = mat3.fromScaling(mat3.create(), vec2.fromValues(40, 100));
    var rotation = mat3.fromRotation(mat3.create(), -0.1);
    var translation = mat3.fromTranslation(mat3.create(), vec2.fromValues(200, 300))

    var projectionMatrix = mat3.create();

    mat3.multiply(projectionMatrix, scale, projectionMatrix);
    mat3.multiply(projectionMatrix, translation, projectionMatrix);
    mat3.multiply(projectionMatrix, rotation, projectionMatrix);

    // Set shader parameters.
    gl.uniform2f(ctx.uScreenResolutionId, 800, 600);
    gl.uniformMatrix3fv(ctx.uProjectionMatrixId, false, projectionMatrix);

    gl.uniform4f(ctx.uColorId, 1, 1, 1, 1);

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