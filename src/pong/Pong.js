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

    // demo:
    gl.clear(gl.COLOR_BUFFER_BIT);

    var scale = mat3.fromScaling(mat3.create(), vec2.fromValues(40, 100));
    var rotation = mat3.fromRotation(mat3.create(), -0.1);
    var translation1 = mat3.fromTranslation(mat3.create(), vec2.fromValues(200, 300));
    var translation2 = mat3.fromTranslation(mat3.create(), vec2.fromValues(600, 300));

    var transform1 = mat3.create();
    mat3.multiply(transform1, scale, transform1);
    mat3.multiply(transform1, rotation, transform1);
    mat3.multiply(transform1, translation1, transform1);

    drawRectangle(transform1, vec4.fromValues(1,1,1,1));

    var transform2 = mat3.create();
    mat3.multiply(transform2, scale, transform2);
    mat3.multiply(transform2, rotation, transform2);
    mat3.multiply(transform2, translation2, transform2);

    drawRectangle(transform2, vec4.fromValues(0,1,0,1));
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
 * @param {mat3} transformationMatrix a transformation matrix which is applied to the rectangle
 * @param {vec4} colorRgb the RGB color the rectangle is drawn with
 */
function drawRectangle(transformationMatrix, colorRgb) {
    "use strict";
    console.log("Drawing");
    //gl.clear(gl.COLOR_BUFFER_BIT);

    gl.bindBuffer(gl.ARRAY_BUFFER, rectangleObject.buffer);
    gl.vertexAttribPointer(ctx.aVertexPositionId, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(ctx.aVertexPositionId);

    // Set shader parameters.
    gl.uniform2f(ctx.uScreenResolutionId, 800, 600);
    gl.uniformMatrix3fv(ctx.uProjectionMatrixId, false, transformationMatrix);
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