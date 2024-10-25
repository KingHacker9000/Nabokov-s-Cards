let w = window.innerWidth;
let h = window.innerHeight;
let note_w = 150
let note_h = 150

const typeMultipliers = {
    "word": 1,
    "scentence": 1.5,
    "paragraph": 2.5
}

let corkTexture;
let emptyHand = true;

let notes = [];
let touch = false
let input;
let button;
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
    constructor(s, x, y, type="word", madeFrom=[]) {
        this.s = s;
        this.x = x;
        this.y = y;
        this.type = type;
        this.madeFrom = madeFrom

        this.w = note_w * typeMultipliers[type];
        this.h = note_h * typeMultipliers[type];

        if (s.length > 400) {
            this.w += (this.s.length - 200)/4
            this.h += (this.s.length - 200)/4
        }
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

        if (mouseX <= 200 && mouseY >= height - 150) {
            fill(200, 0, 0, 100); // Semi-transparent black for the overlay
            stroke(0, 0, 0, 100);
            rect(this.x, this.y, this.w, this.h, 3);
        }

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

    async regenerate(){
        let n1 = this.madeFrom[0]
        let n2 = this.madeFrom[1]
        
        try {
            const url = window.location.href + "/combine"
    
            const data = {
                s1: n1.s,
                type1: n1.type,
                s2: n2.s,
                type2: n2.type
            };
    
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            const reply = await response.json();
            
            this.s = reply.s;

            if (selectedNote == this) {
                input.value(this.s)
            }
    
        } catch (error) {
            console.log(error)
        }

    }

    isMouseOver() {
        return mouseX >= this.x && mouseX <= this.x + this.w &&
        mouseY >= this.y && mouseY <= this.y + this.h
    }

    resize() {

        if (this.s.length > 25 && this.type == "word"){
            this.type = "scentence"
        }
        if (this.s.length > 100) {
            this.type = "paragraph"
        }


        this.w = note_w * typeMultipliers[this.type];
        this.h = note_h * typeMultipliers[this.type];


        if (this.s.length > 400) {
            this.w += (this.s.length - 200)/4
            this.h += (this.s.length - 200)/4
        }
        input.size(this.w, this.h);
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

    make_notes(n=10)

    // Create an input element for editing notes
    input = createElement('textarea');;
    input.input(updateNoteText); // Call updateNoteText function on input
    input.size(width*0.8, 32)
    //input.hide(); // Hide the input by default

    // REGEN BUTTON
    button = createButton('Regenerate');
    button.size(120, 32);

    button.mousePressed(regenerateNote);
    button.hide()

}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    corkTexture = createGraphics(windowWidth, windowHeight);  // Resize the buffer
    createPinBoardTexture(corkTexture);
}

function draw() {
    //background(pinBoardImage); // Set the image as the background
    //when mouse button is pressed, circles turn black
    

    image(corkTexture, 0, 0, windowWidth, windowHeight);

    for (let i = notes.length-1; i >= 0; i--) {
        let note = notes[i];
        if (note.pickedUp) {
            emptyHand = false;
            if(note != selectedNote) {
                note.setCoordinate();
            }
            break
        }
        emptyHand = true
    }

    drawDelCorner()

    notes.forEach(note => {
        note.drawNote()
    });

    drawNewNoteButton()

    if (selectedNote && selected) {
        button.position(selectedNote.x + selectedNote.w - 122, selectedNote.y + selectedNote.h - 34);
    }
    else {
        button.hide()
    }

}

function drawDelCorner() {

    fill(255, 0, 0, 55);
    stroke(255, 0, 0);
    rect(-5, height - 150, 205, 155);
    image(trashImage, 100 - 20, height - 75 - 20, 40, 40);

}

// Detect double click on a note
function doubleClicked() {
    for (let note of notes) {
        if (note.isMouseOver()) {  // Replace with your logic for detecting if a note is clicked
            selectedNote = note;
            input.show();
            if (selectedNote.madeFrom.length > 0) {
                button.show();
            }
            input.position(note.x, note.y);  // Position input near the clicked note
            input.size(selectedNote.w, selectedNote.h);
            input.style('background-color', `rgb(${selectedNote.color[0]}, ${selectedNote.color[1]}, ${selectedNote.color[2]})`);
            input.value(note.s);  // Set the input value to the current note's content
            return;
        }
    }
    selectedNote = null;  // Deselect if double-clicked outside of any note
    input.hide();
    button.hide();
}

function regenerateNote(){
    if(selectedNote.madeFrom != [] && selected){
        selectedNote.regenerate()
    }
}

function updateNoteText() {
    if (selectedNote) {
        selectedNote.s = input.value().replace(/\n/g, ' '); // Update the note's text
        selectedNote.resize()
    }
}

function drawNewNoteButton() {
    const r = 75;

    fill(155, 155, 155, 125)
    stroke(0, 0, 0, 200)
    if ((mouseX - (width - 60))**2 + (mouseY - (height - 60))**2 < r**1.5) {
        fill(100, 100, 100, 125) 
    }
    circle(width - 60, height - 60, r)
    textSize(24);
    textFont('Lora');
    text("+", width - 60, height - 60)
}

function mousePressed() {

    selected = false;
    for (let i = notes.length-1; i >= 0; i--) {
        let note = notes[i];
        // Check if mouse is over the note
        if (mouseX >= note.x && mouseX <= note.x + note.w &&
            mouseY >= note.y && mouseY <= note.y + note.h) {
            note.setMouseCoordinate();
            note.pickedUp = true;  // Pick up the note
            notes = moveToEnd(notes, i);
            selected = true;

            break
        }
    }

    if(height - mouseY  <= 22){
        selected = true;
    }

    if(!selected){
        selectedNote = null;
        input.hide()
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
        if (touchX >= note.x && touchX <= note.x + note.w &&
            touchY >= note.y && touchY <= note.y + note.h) {
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
    // New  Note
    const r = 75;

    if ((mouseX - (width - 60))**2 + (mouseY - (height - 60))**2 < r**1.5) {4
        let new_note = new Note("Enter Text", random(0, width*0.75), random(0, height*0.75));
        notes.push(new_note)
    }

    // Notes Pickup & Merge
    for (let i = notes.length-1; i >= 0; i--) {
        let note = notes[i];
        if (!note) {
            continue
        }
        else if (note.pickedUp) {

            if (mouseX <= 200 && mouseY >= height - 150) {
                moveToEnd(notes, i).pop()
                break
            }

            notes.forEach(other => {
                if(other != note && isOverlapped(note.x, note.y, other)){
                    //other.s += " " + note.s
                    mix_note(other, note)

                    moveToEnd(notes, i).pop()

                    console.log("Remove other note")
                    for (let j = 0; j < notes.length; j++) {
                        const n = notes[j];
                        if(n.s == other.s){
                            moveToEnd(notes, j).pop()
                            break
                        }
                    }
                }
            });

            note.pickedUp = false;  // Drop the note when the mouse is released
        }
        
    }
}

function touchEnded() {
    for (let i = notes.length-1; i >= 0; i--) {
        let note = notes[i];
        if (!note) {
            continue
        }
        else if (note.pickedUp) {

            notes.forEach(other => {
                if(other != note && isOverlapped(note.x, note.y, other)){
                    //other.s += " " + note.s
                    mix_note(other, note)

                    moveToEnd(notes, i).pop()

                    console.log("Remove other note")
                    for (let j = 0; j < notes.length; j++) {
                        const n = notes[j];
                        if(n.s == other.s){
                            moveToEnd(notes, j).pop()
                            break
                        }
                    }
                }
            });

            note.pickedUp = false;  // Drop the note when the mouse is released
        }
        
    }
}

async function mix_note(n1, n2) {

    try {
        const url = window.location.href + "/combine"
        console.log(url)

        const data = {
            s1: n1.s,
            type1: n1.type,
            s2: n2.s,
            type2: n2.type
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        const reply = await response.json();

        // New Node
        notes.push(new Note(reply.s, n1.x, n1.y, reply.type, [n1, n2]))

    } catch (error) {
        console.log(error)
    }
}

async function make_notes(n) {

    try {
        const url = window.location.href + "/notes?n=" + encodeURIComponent(n)
        const response = await fetch(url);
        const reply = await response.text(); // Assuming it's plain text, otherwise adjust to .json() if necessary
        
        reply.split(" ").forEach(s => {
            console.log("New Note!")
            let n = new Note(s, random(0, width*0.75), random(0, height*0.75))
            notes.push(n)
        });

    } catch (error) {
        console.log(error)
    }
}

function drawWrappedText(s, x, y, maxWidth) {
    let words = s.replace(/\n/g, ' ').split(' '); // Split the text into words
    let line = ''; // Initialize an empty line
    let lineHeight = 20; // Set line height (you can change this based on y                                     our font size)

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