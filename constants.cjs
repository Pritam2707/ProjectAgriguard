// ESP32-CAM URL
module.exports.esp32CamUrl = 'http://192.168.164.116';

// Color range for Yellow and Red
module.exports.lowerYellow = { r: 150, g: 150, b: 0 };
module.exports.upperYellow = { r: 255, g: 255, b: 125 };
module.exports.lowerRed = { r: 110, g: 50, b: 50 };
module.exports.upperRed = { r: 255, g: 100, b: 100 };

// Save image for debug
module.exports.isesp32camImageToBeSaved = true;
module.exports.isCroppedImageToBeSaved = true;

// Crop Dimensions
module.exports.cropTop = 50; // Pixels to remove from the top
module.exports.cropBottom = 50; // Pixels to remove from the bottom
module.exports.cropLeft = 50; // Pixels to remove from the left
module.exports.cropRight = 50; // Pixels to remove from the right
