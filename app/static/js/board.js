let DEBUG = false;

let w = window.innerWidth;
let h = window.innerHeight;
let note_w = 150
let note_h = 150

const typeMultipliers = {
    "word": 1,
    "sentence": 1.8,
    "paragraph": 2.5
}

let corkTexture;
let emptyHand = true;

let notes = [];
let touch = false
let input;
let inputElement;
let button;
let decoupleButton;
let deleteButton;
let selected = false;
let selectedNote;


// Tray
let openTray = false;

// Tutorial
let openTutorial = false;

// Touch Specific
let TouchScreen = false;
let touchLastX = 0;
let touchLastY = 0;
let lastTouchTime = 0;
let doubleTapThreshold = 300; // Time in milliseconds
//----------------

let Editing = false;
let Original_Edit;

// Animations
let animations = []; // Array to hold multiple animations

// Word Stash
let wordStash = []

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

        this.sizeFac = 1;
    }

    drawNote() {

        // Check if in Tray Area
        if (openTray && this.x + this.w >= width - TrayWidth) {
            this.sizeFac = map(min((this.x + this.w - width + TrayWidth), this.w), 0, this.w, 1, 0.5)

            if (this.sizeFac == 0.5 && !trayNotes.includes(this)) {
                trayNotes.push(this)
            }
        }
        else if (openTray) {
            this.sizeFac = 1;

            if (trayNotes.includes(this)) {
                moveToEnd(trayNotes, trayNotes.indexOf(this)).pop()
            }
        }
        else {
            this.sizeFac = 1;
        }

        // See Stack
        if (selected && selectedNote == this && this.madeFrom.length > 0) {
            drawMadeFromNote(this.madeFrom[0], this.x+(60*this.sizeFac), this.y-(60*this.sizeFac), this.w*this.sizeFac, this.h*this.sizeFac, this.color)
            drawMadeFromNote(this.madeFrom[1], this.x+(30*this.sizeFac), this.y-(30*this.sizeFac), this.w*this.sizeFac, this.h*this.sizeFac, this.color)
        }


        drawStickyNote(this.x, this.y, this.w, this.h, this.color, this.sizeFac);


        if(this.pickedUp){
            this.drawOverlay(this.x, this.y, this.w*this.sizeFac, this.h*this.sizeFac)
        }

        if (this.madeFrom.length > 0) {

            let pinX = this.x + (10 * this.sizeFac)

            if (this.stackSize() > 5) {
                image(pinImage, pinX, this.y-(15 * this.sizeFac), 40 * this.sizeFac, 40 * this.sizeFac);
                textSize(24 * this.sizeFac)
                text("x" + this.stackSize().toString(), pinX + (50  * this.sizeFac), this.y+(20 * this.sizeFac))
            }
            else {
                for (let i = 0; i < this.stackSize(); i++) {
                    image(pinImage, pinX, this.y-(15 * this.sizeFac), 40 * this.sizeFac, 40 * this.sizeFac); 
                    pinX += 40  * this.sizeFac            
                }
            }
        }
        else {
            image(pinImage, this.x+((this.w/2 - 15)*this.sizeFac), this.y-(15*this.sizeFac), 40 * this.sizeFac, 40 * this.sizeFac);
        }
        fill(0, 0, 0)
        textAlign(CENTER, CENTER);
        let calculatedFontSize = map(max(min(3137464, height * width), 300000), 300000, 3137464, 14, 16)
        textSize(calculatedFontSize * this.sizeFac);
        textFont('Lora');

        drawWrappedText(this.s, Math.trunc(this.x + (this.w/2)*this.sizeFac), Math.trunc(this.y+(60*this.sizeFac)), (this.w - 20)*this.sizeFac, this.sizeFac)
    }

    stackSize() {
        let i = 0;

        if (this.madeFrom.length == 0) {
            return 1
        }

        return this.madeFrom[0].stackSize() + this.madeFrom[1].stackSize()
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
                rect(note.x, note.y, note.w*note.sizeFac, note.h*note.sizeFac, 3*this.sizeFac);
                
                this.pickedUp = false;
                this.drawNote()
                this.pickedUp = true;

                fill(0, 0, 0, 50); // Semi-transparent black for the overlay
                stroke(0, 0, 0, 100);
                rect(this.x, this.y, this.w*this.sizeFac, this.h*this.sizeFac, 3*this.sizeFac);

                fill(255, 255, 255, 50); // Semi-transparent black for the overlay
                stroke(255, 255, 255, 100);
                circle(this.x + this.w*this.sizeFac/2, this.y+(this.h*this.sizeFac/2), 50*this.sizeFac)
                textSize(24);
                textFont('Lora');
                text("+", this.x + this.w*this.sizeFac/2, this.y + this.h*this.sizeFac/2)
            }
        });
        noStroke()
    }

    async regenerate(){
        let n1 = this.madeFrom[0]
        let n2 = this.madeFrom[1]
        
        try {
            const baseUrl = `${window.location.protocol}//${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}`;
            console.log(baseUrl);  // e.g., "https://google.com"

            const url = baseUrl + "/board/combine"
    
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

            Interactions.push({
                "event": "REGENERATE",
                "cards": [
                    {
                        "original_text": original_text,
                        "final_text": selectedNote.s,
                        "words": selectedNote.get_words()
                    }
                ]
            })

            if (selectedNote == this) {
                input.value(this.s)
            }
    
        } catch (error) {
            console.log(error)
        }

    }

    isMouseOver() {
        return mouseX >= this.x && mouseX <= this.x + this.w * this.sizeFac &&
        mouseY >= this.y && mouseY <= this.y + this.h * this.sizeFac
    }

    resize() {

        if (this.s.length > 25 && this.type == "word"){
            this.type = "sentence"
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
    // loadPinBoardTexture(corkTexture);

    make_notes(n=(DEBUG? 3: 5))
    fillWordStash(n=10)

    // Create an input element for editing notes
    input = createElement('textarea');;
    input.input(updateNoteText); // Call updateNoteText function on input
    input.size(width*0.8, 32)
    //input.hide(); // Hide the input by default
    // Apply plain styles
    input.style('border', 'none');        // Remove border
    input.style('outline', 'none');       // Remove outline
    input.style('resize', 'none');        // Disable resizing
    input.style('padding', '10px');          // Remove padding
    input.style('padding-bottom', '20px');          // Remove padding
    input.style('margin', '0');           // Remove margin
    input.style('box-shadow', 'none');    // Remove shadow
    input.style('background-color', 'white'); // Plain white background
    input.style('font-family', 'monospace');  // Monospace font for a plain editor feel
    input.style('font-size', '12px');
    input.id('input')
    inputElement = document.getElementById('input')

    // REGEN Button
    button = createButton('');
    button.size(40, 32);
    // Use CSS to add the image as the button's background
    button.style('background-image', `url(${regenImage})`);
    button.style('background-size', 'cover'); // Makes the image cover the button
    button.style('border', 'none'); // Optional: Remove button border
    button.elt.style.backgroundColor = 'transparent';

    button.mousePressed(regenerateNote);
    button.hide()

    // DECOUPLE Button
    decoupleButton = createButton('');
    decoupleButton.size(40, 32);
    // Use CSS to add the image as the button's background
    decoupleButton.style('background-image', `url(${DCImage})`);
    decoupleButton.style('background-size', 'cover'); // Makes the image cover the button
    decoupleButton.style('border', 'none'); // Optional: Remove button border
    decoupleButton.elt.style.backgroundColor = 'transparent';

    decoupleButton.mousePressed(decoupleNote);
    decoupleButton.hide();

    // DELETE Button
    deleteButton = createButton('');
    deleteButton.size(40, 32);
    // Use CSS to add the image as the button's background
    deleteButton.style('background-image', `url(${delImage})`);
    deleteButton.style('background-size', 'cover'); // Makes the image cover the button
    deleteButton.style('border', 'none'); // Optional: Remove button border
    deleteButton.elt.style.backgroundColor = 'transparent';

    deleteButton.mousePressed(deleteNote);
    deleteButton.hide();

    // Tray Setup
    TrayWidth = width / 6

}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    corkTexture = createGraphics(windowWidth, windowHeight);  // Resize the buffer
    loadPinBoardTexture(corkTexture);
    TrayWidth = width / 6
}

function draw() {

    // Tutorial Slide Pauses Rest of the Program
    if (openTutorial) {
        // Draw Notes
        notes.forEach(note => {
            note.drawNote()
            note.carnation.hide()
        });
        drawTutorialOverlay()
        drawHowToButton()
        return
    }
    
    noStroke()
    fill(27,27,27)
    rect(0, 0, width, height)

    // Reposition Notes
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


    // Tray Specific
    drawTrayButton()
    if(openTray) drawTray()

    // Draw Notes
    notes.forEach(note => {
        note.drawNote()
    });

    drawNewNoteButton()
    drawHowToButton()

    // Note Buttons
    if (selectedNote && selected) {
        spaceAround = 5
        const negHeight = 34 * (1 + selectedNote.imgHeight/500)
        xstart = selectedNote.x + (selectedNote.imgWidth * selectedNote.sizeFac / 2) - (spaceAround + 60) * selectedNote.sizeFac
        button.position(xstart + 80 * selectedNote.sizeFac + (2*spaceAround), selectedNote.y + (selectedNote.imgHeight - negHeight)*selectedNote.sizeFac);
        decoupleButton.position(xstart+ spaceAround + 40 * selectedNote.sizeFac, selectedNote.y + (selectedNote.imgHeight - negHeight)*selectedNote.sizeFac)
        deleteButton.position(xstart, selectedNote.y + (selectedNote.imgHeight - negHeight)*selectedNote.sizeFac)

        input.position(selectedNote.x+25, selectedNote.y+25);  // Position input near the clicked note
        input.size((selectedNote.imgWidth-50) * selectedNote.sizeFac, (selectedNote.imgHeight - 50) * selectedNote.sizeFac);
        input.style('background-color', 'rgba(255,255,255, 0)'); // Plain white background
        input.value(selectedNote.s);  // Set the input value to the current note's content

        drawHoverText()
    }
    else {
        button.hide()
        decoupleButton.hide()
        deleteButton.hide()
    }

    if (touch) {    
        // Touch Specific
        touchLastX = touches[0].x;
        touchLastY = touches[0].y; 
        //----------------
    }

    image(undoImage, 30, height-60, 50, 50)
    image(redoImage, 100, height-60, 50, 50)

    // Draw all animations
    for (let anim of animations) {
        anim.update();
        anim.display();
    }

    // Remove completed animations
    animations = animations.filter((anim) => !anim.isComplete);

}

//Trash Image: image(trashImage, 100 - 20, height - 75 - 20, 40, 40);

// Detect double click on a note
function doubleClicked() {

    if (overOtherButtons()) {
        return
    }

    for (let note of notes) {
        if (note.isMouseOver() && !trayNotes.includes(note)) {  // Replace with your logic for detecting if a note is clicked
            selectedNote = note;
            input.show();

            Editing = true;
            original_text = selectedNote.s;

            //copy_text()
            if (selectedNote.madeFrom.length > 0) {
                button.show();
                decoupleButton.show()
            }
            else {
                button.hide();
                decoupleButton.hide()
            }
            deleteButton.show()
            input.position(note.x+25, note.y+25);  // Position input near the clicked note
            input.size((selectedNote.imgWidth-50) * selectedNote.sizeFac, (selectedNote.imgHeight - 50) * selectedNote.sizeFac);
            //input.style('background-color', `rgb(${selectedNote.color[0]}, ${selectedNote.color[1]}, ${selectedNote.color[2]})`);
            input.style('background-color', 'rgba(255,255,255, 0)'); // Plain white background
            input.value(note.s);  // Set the input value to the current note's content
            inputElement.focus();
            return;
        }
    }

    // ONLY make new Note When NOT Pressing a Side Button
    if (mouseX < width - 150) {
        // Make new note
        // let new_note = new Paper(wordStash.pop(), mouseX, mouseY);
        let new_note = new Paper("Enter Text", mouseX, mouseY);
        const newHistory = new HistoryAdd(new_note)
        history.push(newHistory)
        historyIndex = history.length - 1
        selectedNote = new_note;
        input.show();
        Editing = true;
        original_text = selectedNote.s;
        button.hide();
        decoupleButton.hide()
        selected = true
        deleteButton.show()
        input.position(selectedNote.x+25, selectedNote.y+25);  // Position input near the clicked note
        input.size((selectedNote.imgWidth-50) * selectedNote.sizeFac, (selectedNote.imgHeight - 50) * selectedNote.sizeFac);
        input.style('background-color', 'rgba(255,255,255, 0)'); // Plain white background
        input.value(selectedNote.s);  // Set the input value to the current note's content
        Interactions.push({
            "event": "ADD"
        })
        notes.push(new_note)
        console.log(selectedNote.s)
        return;
    }

    // Dont Select New Note
    if (Editing && original_text!=selectedNote.s) {
        Interactions.push({
            "event": "EDIT",
            "cards": [
                {
                    "original_text": original_text,
                    "final_text": selectedNote.s,
                    "words": selectedNote.get_words()
                }
            ]
        })
        selectedNote = null;
    }
    Editing = false
    input.hide();
    button.hide();
    decoupleButton.hide()
    deleteButton.show()
}

function doubleTapped() {

    if (overOtherButtons()) {
        return
    }

    for (let note of notes) {
        if (touchLastX >= note.x && touchLastX <= note.x + note.w * note.sizeFac &&
            touchLastY >= note.y && touchLastY <= note.y + note.h * note.sizeFac && !trayNotes.includes(note)) {  // Replace with your logic for detecting if a note is clicked
            selectedNote = note;
            input.show();

            Editing = true;
            original_text = selectedNote.s;

            // copy_text()
            if (selectedNote.madeFrom.length > 0) {
                button.show();
                decoupleButton.show()
                deleteButton.show()
            }
            input.position(note.x, note.y);  // Position input near the clicked note
            input.size(selectedNote.imgWidth, selectedNote.imgHeight);
            //input.style('background-color', `rgb(${selectedNote.color[0]}, ${selectedNote.color[1]}, ${selectedNote.color[2]})`);
            input.style('background-color', 'white'); // Plain white background
            input.value(note.s);  // Set the input value to the current note's content
            return;
        }
    }
    if (Editing && original_text!=selectedNote.s) {
        Interactions.push({
            "event": "EDIT",
            "cards": [
                {
                    "original_text": original_text,
                    "final_text": selectedNote.s,
                    "words": selectedNote.get_words()
                }
            ]
        })
    }
    Editing = false
    selectedNote = null;  // Deselect if double-clicked outside of any note
    input.hide();
    button.hide();
    decoupleButton.hide()
    deleteButton.hide()
}

function copy_text(){
    window.setTimeout(()=>{
        inputElement.focus();
        inputElement.select();
        navigator.clipboard.writeText(inputElement.value)
        .then(() => {
            console.log('Text copied to clipboard successfully!');
        })
        .catch((err) => {
            console.error('Failed to copy text: ', err);
        });

    }, 20)
    
}

function overOtherButtons() {
    // How To Button
    if (10 <= mouseX && mouseX <= 66 &&
        10 <= mouseY && mouseY <= 100
    ) {
        return true
    }

    if (openTutorial) return true
    
    // New  Note Button
    if (width-60 <= mouseX && mouseX <= width &&
        height-60 <= mouseY && mouseY <= height
    ) {
        return true;
    }

    // TrayButton
    if (overTrayButton()) {
        return true
    }

    // Undo Button
    if (30 <= mouseX && mouseX <= 80
        && height-60 <= mouseY  && mouseY <= height - 10
    ) {
        return true
    }

    // Redo Button
    if (100 <= mouseX && mouseX <= 150
        && height-60 <= mouseY  && mouseY <= height - 10
    ) {
        return true
    }

    return false
}

function regenerateNote(){
    if(selectedNote.madeFrom != [] && selected && !trayNotes.includes(selectedNote) && ! TimeUp){
        let s = selectedNote.s
        selectedNote.regenerate()
        const newHistory = new HistoryRegenerate(selectedNote, s)
        history.push(newHistory)
        historyIndex = history.length - 1
    }
}

function decoupleNote() {
    if(selectedNote.madeFrom != [] && selected  && !trayNotes.includes(selectedNote) && !TimeUp){
        let n1 = selectedNote.madeFrom[0]
        let n2 = selectedNote.madeFrom[1]

        notes.push(n1)
        notes.push(n2)

        Interactions.push({
            "event": "DECOUPLE",
            "cards": [
                {
                    "original_text": selectedNote.s,
                    "final_text": n1.s,
                    "words": n1.get_words()
                },
                {
                    "original_text": selectedNote.s,
                    "final_text": n2.s,
                    "words": n2.get_words()
                }
            ]
        })

        const newHistory = new HistoryDecouple(n1, n2, selectedNote)
        history.push(newHistory)
        historyIndex = history.length - 1
        selectedNote.carnation.hide()
        moveToEnd(notes, notes.indexOf(selectedNote)).pop()
        selectedNote = null;
        input.hide()
    }
}

function deleteNote() {
    Interactions.push({
        "event": "DELETE"
    })
    const newHistory = new HistoryDelete(selectedNote)
    history.push(newHistory)
    historyIndex = history.length - 1
    moveToEnd(notes, notes.indexOf(selectedNote)).pop();
    selectedNote.carnation.hide()
}

function updateNoteText() {
    if (selectedNote) {
        selectedNote.s = input.value().replace(/\n/g, ' '); // Update the note's text
        selectedNote.resize()
    }
}

function drawNewNoteButton() {

    if (width-60 <= mouseX && mouseX <= width &&
        height-60 <= mouseY && mouseY <= height
    ) {
        image(newLiftImage, width-60, height-60, 50, 50)
    }
    else {
        image(newImage, width-60, height-60, 50, 50)
    }
    
}

function drawHowToButton() {

    let ImageHSize = 80
    image(NabokovImage, 10, 10, NabokovImage.width*(ImageHSize/NabokovImage.height), ImageHSize)
    textSize(36);
    textFont('Lora');
    stroke(0, 0, 0);
    fill(255,255,255)
    textAlign(CENTER, CENTER);
    text(openTutorial? "X":"?", 60, 20)

}

function drawTutorialOverlay() {
    // Popup background
    fill(40, 40, 40, 245); // Black background with slight transparency
    rectMode(CENTER);
    stroke(40)
    rect(width / 2, height / 2, width*0.9, height*0.9, 20); // Rounded rectangle
  
    // Headline text
    textAlign(CENTER, CENTER);
    fill(255); // White text
    textSize(32);
    text("How to use", width *0.7, height *0.1);
  
    // Subheadings
    textSize(20);
    let options = [
      "Adding new cards",
      "Card Options",
      "Merging cards",
      "Decoupling cards",
      "Editing cards",
      "Stashing cards",
    ];
    let ImagesList = [
        newTImage,
        copyTImage,
        coupleTImage,
        decoupleTImage,
        editTImage,
        stashTImage
    ]
  
    let yOffset = 0.2*height;
    let dy = (0.6*height/(options.length))
    imageMode(CENTER)
    for (let i = 0; i < options.length; i++) {
      text(options[i], width *0.7, yOffset);
      let ImageHSize = dy*0.8
      image(ImagesList[i], width*0.7, yOffset + dy/2, ImagesList[i].width*(ImageHSize/ImagesList[i].height), ImageHSize)
      yOffset += dy*1.2;
    }
  
    // Image
    let imgX = width *0.3; // Position of the image
    let imgY = height / 2;
    let imgSize = width*0.2; // Size of the image
  
    // Draw a placeholder for the image
    fill(150); // Gray placeholder
    if (mouseIsPressed) {
        image(NabokovImage, imgX, imgY, imgSize, NabokovImage.height*(imgSize/NabokovImage.width))
    }
    else {
        image(NabokovImageOpen, imgX, imgY, imgSize, NabokovImageOpen.height*(imgSize/NabokovImageOpen.width))
    }
    fill(0);
    textSize(14);
    rectMode(CORNER);
    imageMode(CORNER)
  }

function drawHoverText() {
    stroke(0, 0, 0)
    fill(256, 256, 256)
    textSize(12)

    const delPos = deleteButton.position()
    if (mouseX >= delPos.x && mouseX <= delPos.x+40 &&
        mouseY >= delPos.y && mouseY <= delPos.y+32)
    {
        text("Delete", delPos.x + 20, delPos.y+50)
    }
    const decouplePos = decoupleButton.position()
    if (mouseX >= decouplePos.x && mouseX <= decouplePos.x+40 &&
        mouseY >= decouplePos.y && mouseY <= decouplePos.y+32)
    {
        text("Decouple", decouplePos.x + 20, decouplePos.y+50)
    }
    const regenPos = button.position()
    if (mouseX >= regenPos.x && mouseX <= regenPos.x+40 &&
        mouseY >= regenPos.y && mouseY <= regenPos.y+32)
    {
        text("Regenerate", regenPos.x + 20, regenPos.y+50)
    }

    notes.forEach(note => {
        const LikePos = note.carnation.position()
        if (mouseX >= LikePos.x && mouseX <= LikePos.x+40 &&
            mouseY >= LikePos.y && mouseY <= LikePos.y+32)
        {
            text("Like", LikePos.x + 20, LikePos.y+50)
        }
    });
}

function mousePressed() {

    if (openTutorial) return

    if (wordStash.length <= 2) {
        fillWordStash(n=10)
    }

    // Check Double Tap ---------------
    let currentTime = millis(); // Get the current time in milliseconds

    // Update lastTouchTime to the current time
    lastTouchTime = currentTime;
    //---------------------------------

    selected = false;
    for (let i = notes.length-1; i >= 0; i--) {
        let note = notes[i];
        // Check if mouse is over the note
        if (mouseX >= note.x && mouseX <= note.x + note.w * note.sizeFac &&
            mouseY >= note.y && mouseY <= note.y + note.h * note.sizeFac) {
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
        if (Editing && original_text!=selectedNote.s) {
            Interactions.push({
                "event": "EDIT",
                "cards": [
                    {
                        "original_text": original_text,
                        "final_text": selectedNote.s,
                        "words": selectedNote.get_words()
                    }
                ]
            })
        }
        Editing = false
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

    if (openTutorial) return

    if (wordStash.length <= 2) {
        fillWordStash(n=10)
    }

    // Check Double Tap ---------------
    let currentTime = millis(); // Get the current time in milliseconds

    // Check if the time between the last touch and current touch is within the threshold
    if (currentTime - lastTouchTime < doubleTapThreshold) {
        doubleTapped();
    }

    // Update lastTouchTime to the current time
    lastTouchTime = currentTime;
    //---------------------------------


    selected = false;
    for (let i = notes.length-1; i >= 0; i--) {
        let note = notes[i];
        // Check if touch is over the note
        if (touchX >= note.x && touchX <= note.x + note.w * note.sizeFac &&
            touchY >= note.y && touchY <= note.y + note.h * note.sizeFac) {
            
            note.setMouseCoordinate();
            note.pickedUp = true;  // Pick up the note
            notes = moveToEnd(notes, i);
            selected = true;

            break
        }
    }

    if(height - touchY  <= 22){
        selected = true;
    }

    if(!selected){
        if (Editing && original_text!=selectedNote.s) {
            Interactions.push({
                "event": "EDIT",
                "cards": [
                    {
                        "original_text": original_text,
                        "final_text": selectedNote.s,
                        "words": selectedNote.get_words()
                    }
                ]
            })
        }
        Editing = false
        selectedNote = null;
        input.hide()
    }

    if (selectedNote) {
        input.value(selectedNote.s)
    }
}

function mouseReleased() {

    // How To Button
    if (10 <= mouseX && mouseX <= 66 &&
        10 <= mouseY && mouseY <= 100
    ) {
        openTutorial = !openTutorial;
    }

    if (openTutorial) return
    
    // New  Note Button
    if (width-60 <= mouseX && mouseX <= width &&
        height-60 <= mouseY && mouseY <= height
    ) {
        // let new_note = new Paper(wordStash.pop(), random(0, width*0.75), random(0, height*0.75));
        spot = findEmptySpot()
        let new_note = new Paper("Enter Text", spot.x, spot.y);
        console.log(history, "pre")
        const newAdd = new HistoryAdd(new_note)
        console.log(history, "post")
        history.push(newAdd)
        console.log(history, "post")
        historyIndex = history.length - 1
        Interactions.push({
            "event": "ADD"
        })
        notes.push(new_note)
    }

    // TrayButton
    if (overTrayButton()) {
        clickTrayButton()
    }

    // Undo Button
    if (historyIndex >= 0  && history.length > 0 && 30 <= mouseX && mouseX <= 80
        && height-60 <= mouseY  && mouseY <= height - 10
    ) {
        if (DEBUG) {
            console.log("UNDO", historyIndex)
        }
        Interactions.push({
            "event": "UNDO"
        })
        history[historyIndex].undo()
        historyIndex -= 1
    }

    // Redo Button
    if (historyIndex >= -1 && history.length > 0 && 100 <= mouseX && mouseX <= 150
        && height-60 <= mouseY  && mouseY <= height - 10 && history.length > historyIndex+1
    ) {
        if (DEBUG) {
            console.log("REDO", historyIndex)
        }
        Interactions.push({
            "event": "REDO"
        })
        // Move historyIndex forward first
        historyIndex += 1;
        // Then redo the action at the new historyIndex
        history[historyIndex].redo();
    }

    // Notes Pickup & Merge
    let currentTime = millis(); 
    for (let i = notes.length-1; i >= 0; i--) {
        let note = notes[i];
        if (!note) {
            continue
        }
        else if (note.pickedUp) {

            console.log(currentTime, lastTouchTime)
            notes.forEach(other => {
                if(currentTime - lastTouchTime > 300 && other != note && note.isOverlapped(other)  && !trayNotes.includes(note) && !TimeUp && note.s != "" && other.s != ""){

                    moveToEnd(notes, i).pop()
                    note.carnation.hide()

                    for (let j = 0; j < notes.length; j++) {
                        const n = notes[j];
                        if(n.s == other.s){
                            moveToEnd(notes, j).pop()
                            other.carnation.hide()
                            break
                        }
                    }

                    new_note = new Paper("Loading", note.x, note.y, "word", [note, other])
                    let animation = new LoadingAnimation(note.x, note.y);
                    animations.push(animation);
                    mix_note(other, note, new_note, animation)

                    new_note.madeFrom[0].carnation.hide()
                    new_note.madeFrom[1].carnation.hide()

                }
            });

            note.pickedUp = false;  // Drop the note when the mouse is released
        }
        
    }
}

function touchEnded() {

    // touch Specific
    const touchX = touchLastX 
    const touchY = touchLastY
    touch = false;
    // ----

    // How To Button
    if (10 <= touchX && touchX <= 56 &&
        10 <= touchY && touchY <= 100
    ) {
        openTutorial = !openTutorial;
    }

    if (openTutorial) return

    // New  Note
    if (width-60 <= touchX && touchX <= width &&
        height-60 <= touchY && touchY <= height
    ) {
        // let new_note = new Paper(wordStash.pop(), random(0, width*0.75), random(0, height*0.75));
        spot = findEmptySpot()
        let new_note = new Paper("Enter Text", spot.x, spot.y);
        const newHistory = new HistoryAdd(new_note)
        history.push(newHistory)
        historyIndex = history.length - 1
        Interactions.push({
            "event": "ADD"
        })
        notes.push(new_note)
    }

    // TrayButton
    if (touchOverTrayButton(touchX, touchY)) {
        clickTrayButton()
    }

    // Undo Button
    if (historyIndex >= 0  && history.length > 0 && 30 <= touchX && touchX <= 80
        && height-60 <= touchY  && touchY <= height - 10
    ) {
        if (DEBUG) {
            console.log("UNDO", historyIndex)
        }
        Interactions.push({
            "event": "UNDO"
        })
        history[historyIndex].undo()
        historyIndex -= 1
    }

    // Redo Button
    if (historyIndex >= -1 && history.length > 0 && 100 <= touchX && touchX <= 150
        && height-60 <= touchY  && touchY <= height - 10
    ) {
        if (DEBUG) {
            console.log("REDO", historyIndex)
        }
        Interactions.push({
            "event": "REDO"
        })
        // Move historyIndex forward first
        historyIndex += 1;
        // Then redo the action at the new historyIndex
        history[historyIndex].redo();
    }

    // Notes Pickup & Merge
    let currentTime = millis(); 
    for (let i = notes.length-1; i >= 0; i--) {
        let note = notes[i];
        if (!note) {
            continue
        }
        else if (note.pickedUp) {
            notes.forEach(other => {
                if(currentTime - lastTouchTime > 300 && other != note && note.isOverlapped(other) && !trayNotes.includes(note) && !TimeUp){
                    moveToEnd(notes, i).pop()
                    note.carnation.hide()

                    for (let j = 0; j < notes.length; j++) {
                        const n = notes[j];
                        if(n.s == other.s){
                            moveToEnd(notes, j).pop()
                            other.carnation.hide()
                            break
                        }
                    }

                    new_note = new Paper("", note.x, note.y, "", [note, other])
                    let animation = new LoadingAnimation(note.x, note.y);
                    animations.push(animation);
                    mix_note(other, note, new_note, animation)

                    new_note.madeFrom[0].carnation.hide()
                    new_note.madeFrom[1].carnation.hide()
                }
            });

            note.pickedUp = false;  // Drop the note when the mouse is released
        }
        
    }
}

async function mix_note(n1, n2, new_note, animation) {

    if (TimeUp) return
    if (n1.s == "" || n2.s == "") {
        return
    }

    try {
        const baseUrl = `${window.location.protocol}//${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}`;

        const url = baseUrl + "/board/combine"

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

        if (DEBUG){
            console.log("System Content", reply.Prompt[0])
            console.log("User Content", reply.Prompt[1])
            console.log("------------------------------------------")
        }
        // New Note
        new_note.s = reply.s
        new_note.type = reply.type
        new_note.resize()

        notes.push(new_note)
        selectedNote = new_note;
        input.show();
        Editing = true;
        original_text = selectedNote.s;
        button.show();
        decoupleButton.show()
        selected = true
        deleteButton.show()
        input.position(selectedNote.x+25, selectedNote.y+25);  // Position input near the clicked note
        input.size((selectedNote.imgWidth-50) * selectedNote.sizeFac, (selectedNote.imgHeight - 50) * selectedNote.sizeFac);
        input.style('background-color', 'rgba(255,255,255, 0)'); // Plain white background
        input.value(selectedNote.s);  // Set the input value to the current note's content
        inputElement.focus();
        Interactions.push({
            "event": "COMBINE",
            "cards": [
                {
                    "original_text": n1.s,
                    "final_text": reply.s,
                    "words": n1.get_words()
                },
                {
                    "original_text": n2.s,
                    "final_text": reply.s,
                    "words": n2.get_words()
                }
            ]
        })
        animation.complete()
        const newHistory = new HistoryCouple(n1, n2, notes[notes.length-1])
        history.push(newHistory)
        historyIndex = history.length - 1

    } catch (error) {
        console.log(error)
    }
}

async function make_notes(n) {

    try {
        const baseUrl = `${window.location.protocol}//${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}`;

        let url = baseUrl + "/board/notes?n=" + encodeURIComponent(n)
        let response = await fetch(url);
        let reply = await response.text();
        reply.split(" ").forEach(s => {
            spot = findEmptySpot()
            //let n = new Paper(s, spot.x, spot.y)
            let n = new Paper("", spot.x, spot.y)
            const newHistory = new HistoryAdd(n)
            history.push(newHistory)
            historyIndex = history.length - 1
            notes.push(n)
        });

    } catch (error) {
        console.log(error)
    }
}

async function fillWordStash(n) {
    try {
        const baseUrl = `${window.location.protocol}//${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}`;
        
        url = baseUrl + "/board/notes?n=" + encodeURIComponent(n)
        response = await fetch(url);
        reply = await response.text();
        
        reply.split(" ").forEach(s => {
            wordStash.push(s)
        });

    } catch (error) {
        console.log(error)
    }
}

function drawWrappedText(s, x, y, maxWidth, sizeFac) {
    let words = s.replace(/\n/g, ' ').split(' '); // Split the text into words
    let line = ''; // Initialize an empty line
    let lineHeight = 20 * sizeFac; // Set line height (you can change this based on your font size)

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

function createPinBoardTexture(pg, width, height) {
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
    //pg.text("Pin Board", width/2, 60)

}

function loadPinBoardTexture(pg) {

    pg.image(boardTexture, 0, 0, width, height, 0, 0, width*4, height*4);
    pg.fill(255, 255, 255, 145);
    pg.textAlign(CENTER, CENTER);
    pg.textSize(86);
    pg.textFont('Lora');
    pg.text("Pin Board", width/2, 60)
}

function drawStickyNote(x, y, w, h, color, sizeFac) {
  
    // Draw the shadow for the sticky note
    fill(0, 0, 0, 50); // Semi-transparent black for the shadow
    noStroke()
    rect(x + (10*sizeFac), y + (10*sizeFac), w*sizeFac, h*sizeFac, 10*sizeFac); // Shadow slightly offset

    // Set the color for the sticky note (light yellow)
    fill(color[0], color[1], color[2], 255); // Yellow with some transparency
    stroke(color[0]+30, color[1]+30, color[2]+30); // Light gray stroke for outline
    strokeWeight(2*sizeFac);
    
    // Draw the rectangle (sticky note)
    rect(x, y, w*sizeFac, h*sizeFac, 2*sizeFac); // Rounded corners

    strokeWeight(1*sizeFac);
    fill(0, 0, 0, 30);
    triangle(x+(w*sizeFac), y+((h-35)*sizeFac), x+((w-35)*sizeFac), y+(h*sizeFac), x+((w-35)*sizeFac), y+((h-35)*sizeFac));
}

function drawMadeFromNote(note, x, y, w, h, color) {
  
    // Draw the shadow for the sticky note
    fill(0, 0, 0, 50); // Semi-transparent black for the shadow
    noStroke()
    rect(x + 10, y + 10, w, h, 10); // Shadow slightly offset

    // Set the color for the sticky note (light yellow)
    fill(color[0]-20, color[1]-20, color[2]-20, 255); // Yellow with some transparency
    stroke(color[0]+10, color[1]+10, color[2]+10); // Light gray stroke for outline
    strokeWeight(2);
    
    // Draw the rectangle (sticky note)
    rect(x, y, w, h, 2); // Rounded corners

    strokeWeight(1);
    fill(0, 0, 0, 30);
    triangle(x+w, y+h-35, x+w-35, y+h, x+w-35, y+h-35);

    fill(0, 0, 0)
    textAlign(LEFT, CENTER);
    textSize(map(min(1500000, height * width), 300000, 1500000, 16, 24));
    textFont('Lora');

    s = note.s
    let maxLen = 15

    while (textWidth(s.substring(0, maxLen)) < w - 55 && maxLen < s.length) {
        maxLen += 1
    }

    if (s.length > maxLen) {
        s = s.substring(0, maxLen) + "..."; // Truncate and add ellipsis
    }
    text(s, x + 15, y + 15)
}

function isOverlapped(x, y, note){
    return ((note.x - x)**2 + (note.y - y)**2) <= 8000
}

// Function to instantiate a loading animation at a given position
function startLoadingAnimation(x, y, asyncTask) {
    let animation = new LoadingAnimation(x, y);
    animations.push(animation);
  
    // Wait for the async task to complete, then mark animation as complete
    asyncTask.then(() => animation.complete());
  }

function findEmptySpot(){
    let x = random(0, width*0.75)
    let y = random(0, height*0.75)
    let empty = true

    notes.forEach(note => {
        if(Math.abs(note.x - x) < 100 || Math.abs(note.y - y) < 100){
            empty = false
        }
    });

    let i = 0;

    while(!empty && i < 10) {
        x = random(0, width*0.75)
        y = random(0, height*0.75)
        empty = true

        notes.forEach(note => {
            if(Math.abs(note.x - x) < 100 || Math.abs(note.y - y) < 100){
                empty = false
            }
        });

        i += 1
    }

    return {x: x, y: y}
}