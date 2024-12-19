import * as tf from '@tensorflow/tfjs-node';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { esp32CamUrl,lowerRed,lowerYellow,upperRed,upperYellow,cropBottom,cropLeft,cropRight,cropTop,isCroppedImageToBeSaved,isesp32camImageToBeSaved } from './constants.cjs';
// Calculate __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



const activateSpray = async () => {
    try{
        const Dumpresponse = await fetch(`${esp32CamUrl}/spray`, {
            method: 'GET',
            headers: {
                'Accept': 'text/plain', 
            }
        });
    }
    catch(err){
        console.log("Dumped response"); //Temp workaround
    }
    try {
        // Spray request - Ensure no body is sent, and Content-Length is not set
        const response = await fetch(`${esp32CamUrl}/spray`, {
            method: 'GET', // GET request for spray action
            headers: {
                'Accept': 'text/plain', // Expect plain text response
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to activate spray: ${response.statusText}`);
        }

        const body = await response.text();
        console.log(body); // Should print "Spray activated!"
    } catch (error) {
        console.error('Error activating spray:', error);
    }
};

/**
 * Fetch an image from the ESP32-CAM.
 * @returns {Promise<Buffer>} Buffer of the image.
 */
const fetchImageFromESP32Cam = async () => {
    try {
        const response = await fetch(`${esp32CamUrl}/capture`, {
            method: 'GET', // GET request to capture the image
            headers: {
                'Accept': 'image/jpeg', // Expect image response
                'Content-Length': '0'    // Explicitly set Content-Length to 0
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.statusText}`);
        }

        const contentType = response.headers.get('Content-Type');
        if (!contentType || !contentType.includes('image/jpeg')) {
            throw new Error('Response is not a JPEG image');
        }

        return await response.buffer();
    } catch (error) {
        console.error('Error fetching image from ESP32-CAM:', error);
        throw error;
    }
};

const saveCroppedImage = async (croppedTensor, filename) => {
    try {
        // Encode the cropped tensor to a JPEG buffer
        const jpegBuffer = await tf.node.encodeJpeg(croppedTensor);

        // Define the file path
        const filepath = path.resolve(__dirname, filename);

        // Ensure the directory exists (create it if necessary)
        const dir = path.dirname(filepath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // Save the buffer to a file
        await fs.promises.writeFile(filepath, jpegBuffer);
        console.log(`Cropped image saved to ${filepath}`);
    } catch (error) {
        console.error('Error saving cropped image:', error);
    }
};

/**
 * Save the image buffer to a file.
 * @param {Buffer} imageBuffer Image buffer.
 * @returns {Promise<string>} Path to the saved image file.
 */
const saveImageToFile = async (imageBuffer) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-'); // Generate a timestamp
    const filename = `esp32cam-capture.jpeg`;
    const filepath = path.resolve(__dirname, filename);

    try {
        await fs.promises.writeFile(filepath, imageBuffer);
        console.log(`Image saved to ${filepath}`);
        return filepath;
    } catch (error) {
        console.error('Error saving image to file:', error);
        throw error;
    }
};


const detectColor = async (imageBuffer) => {
    try {
        // Decode the image buffer to a tensor
        const imageTensor = tf.node.decodeImage(imageBuffer);

        // Check dimensions
        const [height, width, channels] = imageTensor.shape;
        if (channels !== 3) {
            throw new Error('Image must have 3 channels (RGB).');
        }

      
        // Calculate new dimensions
        const cropHeight = height - cropTop - cropBottom;
        const cropWidth = width - cropLeft - cropRight;

        if (cropHeight <= 0 || cropWidth <= 0) {
            throw new Error('Crop dimensions are invalid. Ensure the crop size is smaller than the image dimensions.');
        }

        // Crop the image
        const croppedImage = tf.slice(imageTensor, [cropTop, cropLeft, 0], [cropHeight, cropWidth, channels]);

        // Save the cropped image for debugging
        if(isCroppedImageToBeSaved)
         saveCroppedImage(croppedImage, 'cropped-image-debug.jpeg');

        // Normalize pixel values (optional)
        const normalizedImage = croppedImage.div(255);

        // Separate RGB channels
        const [red, green, blue] = tf.split(normalizedImage, 3, -1);

        // Create masks for yellow and red colors
        const yellowMask = tf.logicalAnd(
            tf.logicalAnd(
                tf.greaterEqual(red, tf.scalar(lowerYellow.r / 255)),
                tf.lessEqual(red, tf.scalar(upperYellow.r / 255))
            ),
            tf.logicalAnd(
                tf.logicalAnd(
                    tf.greaterEqual(green, tf.scalar(lowerYellow.g / 255)),
                    tf.lessEqual(green, tf.scalar(upperYellow.g / 255))
                ),
                tf.logicalAnd(
                    tf.greaterEqual(blue, tf.scalar(lowerYellow.b / 255)),
                    tf.lessEqual(blue, tf.scalar(upperYellow.b / 255))
                )
            )
        );
        
        const redMask = tf.logicalAnd(
            tf.logicalAnd(
                tf.greaterEqual(red, tf.scalar(lowerRed.r / 255)),
                tf.lessEqual(red, tf.scalar(upperRed.r / 255))
            ),
            tf.logicalAnd(
                tf.logicalAnd(
                    tf.greaterEqual(green, tf.scalar(lowerRed.g / 255)),
                    tf.lessEqual(green, tf.scalar(upperRed.g / 255))
                ),
                tf.logicalAnd(
                    tf.greaterEqual(blue, tf.scalar(lowerRed.b / 255)),
                    tf.lessEqual(blue, tf.scalar(upperRed.b / 255))
                )
            )
        );

        // Reduce masks to check if any pixel matches
        const yellowDetected = yellowMask.any().dataSync()[0];
        const redDetected = redMask.any().dataSync()[0];

       console.log(`Yellow : ${yellowDetected?"true":"false"} Red : ${redDetected?"true":"false"}`);

        // Trigger spray if needed
        if (yellowDetected || redDetected) {
            await activateSpray();
        }

        // Cleanup
        imageTensor.dispose();
        croppedImage.dispose();
        yellowMask.dispose();
        redMask.dispose();
        normalizedImage.dispose();
    } catch (error) {
        console.error('Error detecting colors:', error);
    }
};

let count =0;
// Main function
const main=async () => {
    try {
        console.log("Cycle "+count+"\n\n");
        console.log('Fetching image from ESP32-CAM...');
        const imageBuffer = await fetchImageFromESP32Cam();
        if(isesp32camImageToBeSaved){
        const imagePath = await saveImageToFile(imageBuffer);
        }
        console.log('Detecting yellow or red color...');
        await detectColor(imageBuffer);

    } catch (error) {
        console.error('An error occurred:', error);
    }
    finally{
        count++;
    }
};
setInterval(main,5000);
