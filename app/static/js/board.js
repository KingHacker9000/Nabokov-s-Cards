let w = window.innerWidth;
let h = window.innerHeight;
let note_w = 150
let note_h = 150

let corkTexture;
let emptyHand = true;

let notes = [];
let touch = false
let input;
let selected = false;
let selectedNote;

const stickyNoteColors = [
    { name: "Classic Yellow", rgb: [255, 255, 153] },
    { name: "Soft Pink", rgb: [255, 182, 193] },
    { name: "Light Green", rgb: [204, 255, 204] },
    { name: "Sky Blue", rgb: [173, 216, 230] },
    { name: "Pastel Purple", rgb: [236, 211, 246] },
    { name: "Bright Orange", rgb: [255, 200, 87] },
    { name: "Light Coral", rgb: [240, 128, 128] },
    { name: "Pale Cyan", rgb: [224, 255, 255] },
    { name: "Peach", rgb: [255, 218, 185] }
];

class Note {
    constructor(s, x, y) {
        this.s = s;
        this.x = x;
        this.y = y;
        this.w = note_w;
        this.h = note_h;
        this.pickedUp = false;
        this.mousedX;
        this.mousedY;

        const randomIndex = Math.floor(Math.random() * stickyNoteColors.length);
        this.color = stickyNoteColors[randomIndex].rgb;
    }

    drawNote() {
        drawStickyNote(this.x, this.y, this.w, this.h, this.color);
        if(this.pickedUp){
            this.drawOverlay(this.x, this.y, this.w, this.h)
        }
        image(pinImage, this.x+this.w/2 - 15, this.y-15, 40, 40);
        fill(0, 0, 0)
        textAlign(CENTER, CENTER);
        textSize(map(min(1500000, height * width), 300000, 1500000, 16, 24));
        textFont('Lora');

        drawWrappedText(this.s, Math.trunc(this.x + this.w/2), Math.trunc(this.y+60), this.w - 20)
    }

    setCoordinate(){
        // this.x = Math.trunc(mouseX - note_w/2)
        // this.y = mouseY-20
        this.x = (!touch ? mouseX : touches[0].x) - this.mousedX
        this.y = (!touch ? mouseY : touches[0].y) - this.mousedY
    }

    setMouseCoordinate(){
        this.mousedX = (!touch ? mouseX : touches[0].x) - this.x;
        this.mousedY = (!touch ? mouseY : touches[0].y) - this.y;
    }

    drawOverlay(){
        fill(0, 0, 0, 50); // Semi-transparent black for the overlay
        stroke(0, 0, 0, 100);
        notes.forEach(note => {
            if (note != this && isOverlapped(this.x, this.y, note)){
                note.drawNote()
                fill(0, 0, 0, 50); // Semi-transparent black for the overlay
                stroke(0, 0, 0, 100);
                rect(note.x, note.y, note.w, note.h, 3);
                
                this.pickedUp = false;
                this.drawNote()
                this.pickedUp = true;

                fill(0, 0, 0, 50); // Semi-transparent black for the overlay
                stroke(0, 0, 0, 100);
                rect(this.x, this.y, this.w, this.h, 3);

                fill(255, 255, 255, 50); // Semi-transparent black for the overlay
                stroke(255, 255, 255, 100);
                circle(this.x + this.w/2, this.y+this.h/2, 50)
                textSize(24);
                textFont('Lora');
                text("+", this.x + this.w/2, this.y+this.h/2)
            }
        });
        noStroke()
    }
}

function setup() {
    createCanvas(windowWidth, windowHeight);
    //createPinBoardTexture()

    // Create an off-screen graphics buffer
    corkTexture = createGraphics(windowWidth, windowHeight);
        
    // Generate the cork texture in the buffer
    createPinBoardTexture(corkTexture);
    notes = []

    for (let i = 0; i < 16; i++) {
        let s = "Text" + i.toString()
        let n = new Note(s, random(0, width*0.75), random(0, height*0.75))
        notes.push(n)
        
    }
    
    // Create an input element for editing notes
    input = createInput('');
    input.input(updateNoteText); // Call updateNoteText function on input
    input.size(width-10, 32)
    //input.hide(); // Hide the input by default

}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    corkTexture = createGraphics(windowWidth, windowHeight);  // Resize the buffer
    createPinBoardTexture(corkTexture);
}

function draw() {
    //background(pinBoardImage); // Set the image as the background
    //when mouse button is pressed, circles turn black
    if (!selected) {
        resizeCanvas(windowWidth, windowHeight);
        input.hide();
    }
    else{
        resizeCanvas(windowWidth, windowHeight-42);
        input.show();
        if (selectedNote) {
            input.value(selectedNote.s)
        }
    }

    image(corkTexture, 0, 0, windowWidth, windowHeight);

    for (let i = notes.length-1; i >= 0; i--) {
        let note = notes[i];
        if (note.pickedUp) {
            emptyHand = false;
            note.setCoordinate();
            break
        }
        emptyHand = true
    }

    notes.forEach(note => {
        note.drawNote()
    });

}

function updateNoteText() {
    if (selectedNote) {
        selectedNote.s = input.value(); // Update the note's text
    }
}

function mousePressed() {

    selected = false;
    for (let i = notes.length-1; i >= 0; i--) {
        let note = notes[i];
        // Check if mouse is over the note
        if (mouseX >= note.x && mouseX <= note.x + note_w &&
            mouseY >= note.y && mouseY <= note.y + note_h) {
            note.setMouseCoordinate();
            note.pickedUp = true;  // Pick up the note
            notes = moveToEnd(notes, i);
            selected = true;
            selectedNote = note
            break
        }
    }

    if(height - mouseY  <= 22){
        selected = true;
    }

    if(!selected){
        selectedNote = null;
    }

    if (selectedNote) {
        input.value(selectedNote.s)
    }

}

function touchStarted() {

    // touch Specific
    touch = true
    const touchX = touches[0].x 
    const touchY = touches[0].y
    // ----


    selected = false;
    for (let i = notes.length-1; i >= 0; i--) {
        let note = notes[i];
        // Check if touch is over the note
        if (touchX >= note.x && touchX <= note.x + note_w &&
            touchY >= note.y && touchY <= note.y + note_h) {
                note.setMouseCoordinate();
                note.pickedUp = true;  // Pick up the note
                notes = moveToEnd(notes, i);
                selected = true;
                selectedNote = note
                break
        }
    }

    if(height - mouseY  <= 22){
        selected = true;
    }

    if(!selected){
        selectedNote = null;
    }

    if (selectedNote) {
        input.value(selectedNote.s)
    }
}

function mouseReleased() {
    for (let i = notes.length-1; i >= 0; i--) {
        let note = notes[i];

        if (note.pickedUp) {

            notes.forEach(other => {
                if(other != note && isOverlapped(note.x, note.y, other)){
                    other.s += " " + note.s
                    other.w = ((other.w + note.w)/2)*1.15;
                    other.h = ((other.h + note.h)/2)*1.15;
                    moveToEnd(notes, i).pop()
                }
            });

            note.pickedUp = false;  // Drop the note when the mouse is released
        }
        
    }
}

function touchEnded() {
    for (let i = notes.length-1; i >= 0; i--) {
        let note = notes[i];

        if (note.pickedUp) {

            notes.forEach(other => {
                if(other != note && isOverlapped(note.x, note.y, other)){
                    other.s += " " + note.s
                    moveToEnd(notes, i).pop()
                }
            });

            note.pickedUp = false;  // Drop the note when the mouse is released
        }
        
    }
}

function drawWrappedText(s, x, y, maxWidth) {
    let words = s.split(' '); // Split the text into words
    let line = ''; // Initialize an empty line
    let lineHeight = 20; // Set line height (you can change this based on your font size)

    for (let i = 0; i < words.length; i++) {
        let testLine = line + words[i] + ' '; // Build the test line
        let testWidth = textWidth(testLine); // Get the width of the test line

        // If the test width exceeds the maximum width, draw the line and start a new one
        if (testWidth > maxWidth && i > 0) {
            text(line, x, y); // Draw the line
            line = words[i] + ' '; // Start a new line with the current word
            y += lineHeight; // Move down to the next line
        } else {
            line = testLine; // Otherwise, continue adding words to the line
        }
    }
    text(line, x, y); // Draw any remaining text in the last line
}

function moveToEnd(arr, i) {
    if (i >= 0 && i < arr.length) {
        let element = arr.splice(i, 1)[0]; // Remove the element at index i
        arr.push(element); // Add the removed element to the end
    }
    return arr;
}

function createPinBoardTexture(pg) {
    pg.fill(136, 81, 34);  // Brown colors (hue, saturation, brightness)
    pg.noStroke();
    pg.rect(0, 0, width, height);
    pg.noiseDetail(40, 0.1);  // Adjust noise settings if needed
    noiseDetail(40, 0.1);
    for (let x = 0; x < width; x += 3) {
      for (let y = 0; y < height; y += 3) {
        let noiseVal = noise(x * 0.2, y * 0.2) + random();  // Perlin noise for natural variation
        let randomNum = map(Math.random(), 0, 1, -0.45, -0.2)
        noiseVal += randomNum
        noiseVal = min(noiseVal, 1)
        let RcolorValue = map(noiseVal, 0, 1, 136, 255);  // Light brown to dark brown shades
        let GcolorValue = map(noiseVal, 0, 1, 81, 239);
        let BcolorValue = map(noiseVal, 0, 1, 34, 195);
        pg.fill(RcolorValue, GcolorValue, BcolorValue, 128);  // Brown colors (hue, saturation, brightness)
        pg.noStroke();
        pg.rect(x, y, 3, 3);  // Draw small squares
      }
    }

    pg.fill(255, 255, 255, 145);
    pg.textAlign(CENTER, CENTER);
    pg.textSize(86);
    pg.textFont('Lora');
    pg.text("Pin Board", width/2, 60)

}

function drawStickyNote(x, y, w, h, color) {
  
    // Draw the shadow for the sticky note
    fill(0, 0, 0, 50); // Semi-transparent black for the shadow
    noStroke()
    rect(x + 10, y + 10, w, h, 10); // Shadow slightly offset

    // Set the color for the sticky note (light yellow)
    fill(color[0], color[1], color[2], 255); // Yellow with some transparency
    stroke(color[0]+30, color[1]+30, color[2]+30); // Light gray stroke for outline
    strokeWeight(2);
    
    // Draw the rectangle (sticky note)
    rect(x, y, w, h, 2); // Rounded corners

    strokeWeight(1);
    fill(0, 0, 0, 30);
    triangle(x+w, y+h-35, x+w-35, y+h, x+w-35, y+h-35);
}


function isOverlapped(x, y, note){
    return ((note.x - x)**2 + (note.y - y)**2) <= 8000
}